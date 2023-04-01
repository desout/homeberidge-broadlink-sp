import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue,
  Logging,
  Service,
} from 'homebridge';
import * as broadlink from 'node-broadlink';

export class ExampleSwitch implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly name: string;
  private readonly ip: string;
  private switchOn = false;

  private readonly switchService: Service;
  private readonly informationService: Service;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    const {hap} = api;
    this.log = log;
    this.name = config.name;
    this.ip = config.ip;

    if (!this.ip || !this.name) {
      throw new Error('You must provide a config value for \'name\' or \'ip\'.');
    }

    this.switchService = new hap.Service.Switch(this.name);
    this.switchService.getCharacteristic(hap.Characteristic.On)
      .on(CharacteristicEventTypes.GET, this.getState)
      .on(CharacteristicEventTypes.SET, this.setState);

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Custom Manufacturer')
      .setCharacteristic(hap.Characteristic.Model, 'Custom Model');

    log.info('Switch finished initializing!');
  }

  /*
     * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
     * Typical this only ever happens at the pairing process.
     */
  identify(): void {
    this.log('Identify!');
  }

  getState = function(callback) {

  };

  setState = function(state, callback) {
  };

  /*
     * This method is called directly after creation of this instance.
     * It should return all services which should be added to the accessory.
     */
  getServices(): Service[] {
    return [
      this.informationService,
      this.switchService,
    ];
  }

}