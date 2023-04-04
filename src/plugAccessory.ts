import {AccessoryPlugin, CharacteristicValue, PlatformAccessory, Service} from 'homebridge';
import * as broadlink from 'node-broadlink';

import {BroadlinkHomebridgePlatform} from './platform';
import {Sp4b} from 'node-broadlink';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class PlugAccessory implements AccessoryPlugin {
  private readonly service: Service;
  private readonly plug: Sp4b;
  constructor(
    private readonly platform: BroadlinkHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly manufacturer: string,
    private readonly model: string,
    private readonly _plug: Sp4b,
  ) {
    this.plug = _plug;
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    const plug = await this.getDevice();
    await plug.setPower(value as boolean);

    this.platform.log.debug('Set Characteristic On ->', value);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    // implement your own code to turn your device on/off
    const plug = await this.getDevice();
    const power = await plug.checkPower();

    this.platform.log.debug('Get Characteristic On ->', power);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return power;
  }

  /*
  * This method is called directly after creation of this instance.
  * It should return all services which should be added to the accessory.
  */
  getServices(): Service[] {
    return [
      this.service,
    ];
  }

  /*
  * This method is called directly after creation of this instance.
  * It should return all services which should be added to the accessory.
  */
  async getDevice(): Promise<Sp4b> {
    const { host } = this.accessory.context;
    this.platform.log.debug('host', host);
    const devices = await broadlink.discover(undefined, {address: '0.0.0.0', broadcastAddress: '255.255.255.255'});
    this.platform.log.debug('devices', devices);
    const plug = devices.find(d => d.host.address === host.address) as Sp4b;
    this.platform.log.debug('plug', plug);
    return (await plug.auth()) as Sp4b;
  }
}
