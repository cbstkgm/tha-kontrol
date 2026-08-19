import L from 'leaflet';
import { createTileLayerComponent, updateGridLayer } from '@react-leaflet/core';

const AuthWMS = L.TileLayer.WMS.extend({
  createTile: function (coords: any, done: any) {
    const tile = document.createElement('img');

    L.DomEvent.on(tile, 'load', L.bind(this._tileOnLoad, this, done, tile));
    L.DomEvent.on(tile, 'error', L.bind(this._tileOnError, this, done, tile));

    if (this.options.crossOrigin || this.options.crossOrigin === '') {
      tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
    }
    tile.alt = '';
    tile.setAttribute('role', 'presentation');

    const url = this.getTileUrl(coords);
    const authHeader = 'Basic ' + btoa('tk41671:Jackass+0078');

    fetch(url, {
      headers: {
        'Authorization': authHeader
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`WMS fetch error: ${response.status}`);
      }
      return response.blob();
    })
    .then(blob => {
      tile.src = URL.createObjectURL(blob);
    })
    .catch(error => {
      console.error('WMS Layer Error:', error);
      // @ts-ignore
      done(error, tile);
    });

    return tile;
  }
});

const createAuthWMSLayer = (props: any, context: any) => {
  const instance = new AuthWMS(props.url, { ...props });
  return { instance, context };
};

const updateAuthWMSLayer = (instance: any, props: any, prevProps: any) => {
  updateGridLayer(instance, props, prevProps);
  if (props.url !== prevProps.url) {
    instance.setUrl(props.url);
  }
};

export const AuthWMSTileLayer = createTileLayerComponent(createAuthWMSLayer, updateAuthWMSLayer);
