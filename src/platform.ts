import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
  APIEvent,
} from 'homebridge';

import {DEFAULT_ADDRESS, DEFAULT_BROADCAST_ADDRESS, PLATFORM_NAME, PLUGIN_NAME} from './settings';
import * as broadlink from 'node-broadlink';
import {Sp4b} from 'node-broadlink';
import {PlugAccessory} from './plugAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class BroadlinkHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  private readonly address = DEFAULT_ADDRESS;
  private readonly broadcastAddress = DEFAULT_BROADCAST_ADDRESS;
  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    if(config.address) {
      this.address = config.address;
    }

    if(config.broadcastAddress) {
      this.broadcastAddress = config.broadcastAddress;
    }

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, async () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      await this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    const devices = await broadlink.discover(undefined, {address: this.address, broadcastAddress: this.broadcastAddress});
    this.log.info('test:', devices, devices.map(device => device.constructor.name.toLowerCase()));
    for (const device of devices) {
      switch (device.constructor.name.toLowerCase()) {
        case 'sp4b': {
          const plug = device as Sp4b;
          const {mac, name, manufacturer, model} = plug;


          await plug.auth();

          const uuid = this.api.hap.uuid.generate(mac.join('.'));
          const existingAccessory = this.accessories.find(
            accessory => accessory.UUID === uuid,
          );

          if (existingAccessory) {
            // the accessory already exists
            this.log.info(
              'Restoring existing accessory from cache:',
              existingAccessory.displayName,
            );
            new PlugAccessory(this, existingAccessory, manufacturer, model, plug);
          } else {
            this.log.info(
              'registering new accessory:',
              name,
            );
            const accessory = new this.api.platformAccessory(
              name,
              uuid,
            );
            accessory.context.host = device.host;

            new PlugAccessory(this, accessory, manufacturer, model, plug);

            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
              accessory,
            ]);

          }
        }
      }
    }
  }
}
