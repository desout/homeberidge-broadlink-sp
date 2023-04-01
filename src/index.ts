import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import {ExampleSwitch} from './Accessory';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerAccessory(PLATFORM_NAME, ExampleSwitch);
};
