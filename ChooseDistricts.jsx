import React from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import { Button, Container, Row, Col, Form, Modal } from 'react-bootstrap';
import styles from './ChooseDistricts.module.css';
import useAxiosPrivate from '../../../../../../hooks/useAxiosPrivate';
import useAuth from '../../../../../../hooks/useAuth';

const API_KEY = process.env.REACT_APP_API_KEY;
const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 39.4699,
  lng: -0.3763,
};

const mapOptions = {
  center: center,
  zoom: 12,
  mapId: 'e4937e1d0f5e1b9',
  maxZoom: 14,
  minZoom: 11,
  stylers: [{ visibility: 'off' }],
  clickableIcons: false,
  fullscreenControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  keyboardShortcuts: false,
};

function ChooseDistricts({ t, setIsChangesSaved }) {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const [regions, setRegions] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const featureLayer = React.useRef(null);
  const [isChecked, setIsChecked] = useState(false);
  const [disabledSave, setDisabledSave] = useState(true);
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY,
  });
  const [show, setShow] = useState(false);
  const handleClose = () => {
    setShow(false);
    setDisabledSave(true);
    setIsChecked(false);
  };
  const handleShow = () => setShow(true);

  const onLoad = (map) => {
    featureLayer.current = map.getFeatureLayer('POSTAL_CODE');
    axiosPrivate.get('Workers/get-districts').then((response) => {
      setRegions(response.data);
      applyStyleDefault(response.data);
    });
    axiosPrivate
      .get('Workers/get-worker-districts?email=' + auth.email)
      .then((response) => {
        console.log(response.data);
        //setInitialRegions(response.data);
        setSelectedRegions(response.data);
      })
      .catch((err) => console.log(err));
    featureLayer.current.addListener('click', handlePlaceClick);
  };

  const handleSubmit = () => {
    console.log(selectedRegions);
    axiosPrivate
      .post('Workers/post-districts?email=' + auth.email, selectedRegions)
      .then((response) => {
        console.log(response);
        setIsChangesSaved(true);
      })
      .catch((error) => {
        console.log(error);
      });
    handleShow();
  };

  const applyStyleDefault = (data) => {
    featureLayer.current.style = (options) => {
      const feature = options.feature;
      const id = feature.placeId;
      if (data.includes(id)) {
        return styleDefault;
      }
    };
  };

  function handlePlaceClick(event) {
    setIsChangesSaved(false);
    setDisabledSave(false);
    let feature = event.features[0];
    let id = feature.placeId;
    setSelectedRegions((prevSelectedRegions) => {
      if (prevSelectedRegions.includes(id)) {
        const updated = prevSelectedRegions.filter((regionId) => regionId !== id);
        return updated;
      } else {
        const updated = [...prevSelectedRegions, id];
        return updated;
      }
    });
  }

  const applyStyleChecked = () => {
    if (featureLayer.current != null) {
      featureLayer.current.style = (options) => {
        const feature = options.feature;
        const id = feature.placeId;
        if (selectedRegions.includes(id)) return styleClicked;
        if (regions.includes(id)) {
          return styleDefault;
        }
      };
    }
  };
  const handleCheckboxChange = () => {
    setIsChangesSaved(false);
    setDisabledSave(false);
    if (!isChecked) {
      setSelectedRegions(regions);
    } else {
      setSelectedRegions([]);
    }
    setIsChecked(!isChecked);
  };

  useEffect(() => {
    applyStyleChecked();
  }, [selectedRegions]);

  return isLoaded ? (
    <Container>
      <Row>
        <Row>
          <Form className={styles.formContainer}>
            <Form.Check
              type="checkbox"
              id="default-checkbox"
              label={t('Profile.tab_content.calendar.map.checkbox')}
              checked={isChecked}
              onChange={handleCheckboxChange}
            />
          </Form>
        </Row>
        <Col xs={12} lg={10}>
          <div className={styles.mapContainer}>
            <GoogleMap
              mapContainerStyle={containerStyle}
              options={mapOptions}
              onLoad={onLoad}></GoogleMap>
          </div>
        </Col>
      </Row>

      <Row className={styles.centered}>
        <Col md={4} xs={10}>
          <Button
            variant="dark"
            className={styles.btn}
            onClick={handleSubmit}
            disabled={disabledSave}>
            <b>{t('Profile.tab_content.calendar.map.save')}</b>
          </Button>
        </Col>
      </Row>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{t('Profile.tab_content.calendar.map.modal_header')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{t('Profile.tab_content.calendar.map.modal_body')}</Modal.Body>
        <Modal.Footer>
          <Button className="custom-btn-text-black" onClick={handleClose}>
            <b>{t('Profile.tab_content.calendar.warnings.close')}</b>
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  ) : (
    <></>
  );
}

const styleDefault = {
  strokeColor: '#810FCB',
  strokeOpacity: 1.0,
  strokeWeight: 2.0,
  fillColor: 'white',
  fillOpacity: 0.1, // Polygons must be visible to receive click events.
};
const styleClicked = {
  ...styleDefault,
  fillColor: '#810FCB',
  fillOpacity: 0.5,
};

const noStyle = {
  strokeColor: 'white',
  fillColor: 'white',
};

export default ChooseDistricts;
