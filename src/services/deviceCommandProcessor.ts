import { DeviceType, DeviceCommand } from '../models/smartDeviceModel';

// 命令处理器接口
interface CommandProcessor {
  validateCommand(command: DeviceCommand): boolean;
  processCommand(command: DeviceCommand): any;
}

// 基础命令处理器
abstract class BaseCommandProcessor implements CommandProcessor {
  protected abstract readonly type: DeviceType;
  protected abstract readonly supportedCommands: string[];

  validateCommand(command: DeviceCommand): boolean {
    return (
      command &&
      typeof command === 'object' &&
      'command' in command &&
      this.supportedCommands.includes(command.command)
    );
  }

  abstract processCommand(command: DeviceCommand): any;
}

// 智能灯命令处理器
class LightCommandProcessor extends BaseCommandProcessor {
  protected readonly type = DeviceType.LIGHT;
  protected readonly supportedCommands = ['turn_on', 'turn_off', 'set_brightness', 'set_color_temp'];

  processCommand(command: DeviceCommand): DeviceCommand {
    switch (command.command) {
      case 'turn_on':
        return command;
      case 'turn_off':
        return command;
      case 'set_brightness':
        const brightness = Number(command.params?.brightness);
        if (isNaN(brightness) || brightness < 0 || brightness > 100) {
          throw new Error('Invalid brightness value');
        }
        return command;
      case 'set_color_temp':
        const colorTemp = Number(command.params?.color_temp);
        if (isNaN(colorTemp) || colorTemp < 2700 || colorTemp > 6500) {
          throw new Error('Invalid color temperature value');
        }
        return command;
      default:
        throw new Error(`Unsupported command: ${command.command}`);
    }
  }
}

// 温控器命令处理器
class ThermostatCommandProcessor extends BaseCommandProcessor {
  protected readonly type = DeviceType.THERMOSTAT;
  protected readonly supportedCommands = ['set_temp', 'set_mode', 'set_fan_speed'];

  processCommand(command: DeviceCommand): any {
    switch (command.command) {
      case 'set_temp':
        const temp = Number(command.params?.temp);
        if (isNaN(temp) || temp < 16 || temp > 30) {
          throw new Error('Invalid temperature value');
        }
        return { target_temp: temp };
      case 'set_mode':
        const mode = command.params?.mode;
        if (!['auto', 'heat', 'cool'].includes(mode)) {
          throw new Error('Invalid mode value');
        }
        return { mode };
      case 'set_fan_speed':
        const fanSpeed = command.params?.fan_speed;
        if (!['auto', 'low', 'medium', 'high'].includes(fanSpeed)) {
          throw new Error('Invalid fan speed value');
        }
        return { fan_speed: fanSpeed };
      default:
        throw new Error(`Unsupported command: ${command.command}`);
    }
  }
}

// 智能门锁命令处理器
class DoorLockCommandProcessor extends BaseCommandProcessor {
  protected readonly type = DeviceType.DOOR_LOCK;
  protected readonly supportedCommands = ['lock', 'unlock'];

  processCommand(command: DeviceCommand): any {
    switch (command.command) {
      case 'lock':
        return { locked: true };
      case 'unlock':
        return { locked: false };
      default:
        throw new Error(`Unsupported command: ${command.command}`);
    }
  }
}

// 智能窗帘命令处理器
class BlindCommandProcessor extends BaseCommandProcessor {
  protected readonly type = DeviceType.BLIND;
  protected readonly supportedCommands = ['set_position', 'set_tilt'];

  processCommand(command: DeviceCommand): any {
    switch (command.command) {
      case 'set_position':
        const position = Number(command.params?.position);
        if (isNaN(position) || position < 0 || position > 100) {
          throw new Error('Invalid position value');
        }
        return { position };
      case 'set_tilt':
        const tilt = Number(command.params?.tilt);
        if (isNaN(tilt) || tilt < 0 || tilt > 180) {
          throw new Error('Invalid tilt value');
        }
        return { tilt };
      default:
        throw new Error(`Unsupported command: ${command.command}`);
    }
  }
}

// 空调命令处理器
class AirConditionerCommandProcessor extends BaseCommandProcessor {
  protected readonly type = DeviceType.AIR_CONDITIONER;
  protected readonly supportedCommands = ['turn_on', 'turn_off', 'set_temp', 'set_mode', 'set_fan_speed', 'set_swing'];

  processCommand(command: DeviceCommand): any {
    switch (command.command) {
      case 'turn_on':
        return { on: true };
      case 'turn_off':
        return { on: false };
      case 'set_temp':
        const temp = Number(command.params?.temp);
        if (isNaN(temp) || temp < 16 || temp > 30) {
          throw new Error('Invalid temperature value');
        }
        return { temp };
      case 'set_mode':
        const mode = command.params?.mode;
        if (!['cool', 'heat', 'dry', 'fan'].includes(mode)) {
          throw new Error('Invalid mode value');
        }
        return { mode };
      case 'set_fan_speed':
        const fanSpeed = command.params?.fan_speed;
        if (!['auto', 'low', 'medium', 'high'].includes(fanSpeed)) {
          throw new Error('Invalid fan speed value');
        }
        return { fan_speed: fanSpeed };
      case 'set_swing':
        return { swing: Boolean(command.params?.swing) };
      default:
        throw new Error(`Unsupported command: ${command.command}`);
    }
  }
}

// 烟雾报警器命令处理器
class SmokeDetectorCommandProcessor extends BaseCommandProcessor {
  protected readonly type = DeviceType.SMOKE_DETECTOR;
  protected readonly supportedCommands = ['reset_alarm', 'test'];

  processCommand(command: DeviceCommand): any {
    switch (command.command) {
      case 'reset_alarm':
        return { alarm: false };
      case 'test':
        return { last_test_time: new Date() };
      default:
        throw new Error(`Unsupported command: ${command.command}`);
    }
  }
}

// 风扇命令处理器
class FanCommandProcessor extends BaseCommandProcessor {
  protected readonly type = DeviceType.FAN;
  protected readonly supportedCommands = ['turn_on', 'turn_off', 'set_speed', 'set_oscillate', 'set_timer'];

  processCommand(command: DeviceCommand): any {
    switch (command.command) {
      case 'turn_on':
        return { on: true };
      case 'turn_off':
        return { on: false };
      case 'set_speed':
        const speed = Number(command.params?.speed);
        if (isNaN(speed) || speed < 1 || speed > 3) {
          throw new Error('Invalid speed value');
        }
        return { speed };
      case 'set_oscillate':
        return { oscillate: Boolean(command.params?.oscillate) };
      case 'set_timer':
        const timer = Number(command.params?.timer);
        if (isNaN(timer) || timer < 0 || timer > 120) {
          throw new Error('Invalid timer value');
        }
        return { timer };
      default:
        throw new Error(`Unsupported command: ${command.command}`);
    }
  }
}

// 智能插座命令处理器
class PlugCommandProcessor extends BaseCommandProcessor {
  protected readonly type = DeviceType.PLUG;
  protected readonly supportedCommands = ['turn_on', 'turn_off', 'set_timer'];

  processCommand(command: DeviceCommand): any {
    switch (command.command) {
      case 'turn_on':
        return { on: true };
      case 'turn_off':
        return { on: false };
      case 'set_timer':
        const timer = Number(command.params?.timer);
        if (isNaN(timer) || timer < 0 || timer > 120) {
          throw new Error('Invalid timer value');
        }
        return { timer };
      default:
        throw new Error(`Unsupported command: ${command.command}`);
    }
  }
}

// 命令处理器工厂
export class DeviceCommandProcessorFactory {
  private static processors: Map<DeviceType, CommandProcessor> = new Map();

  static {
    // 注册所有设备类型的命令处理器
    this.processors.set(DeviceType.LIGHT, new LightCommandProcessor());
    this.processors.set(DeviceType.THERMOSTAT, new ThermostatCommandProcessor());
    this.processors.set(DeviceType.DOOR_LOCK, new DoorLockCommandProcessor());
    this.processors.set(DeviceType.BLIND, new BlindCommandProcessor());
    this.processors.set(DeviceType.AIR_CONDITIONER, new AirConditionerCommandProcessor());
    this.processors.set(DeviceType.SMOKE_DETECTOR, new SmokeDetectorCommandProcessor());
    this.processors.set(DeviceType.FAN, new FanCommandProcessor());
    this.processors.set(DeviceType.PLUG, new PlugCommandProcessor());
  }

  static getProcessor(type: DeviceType): CommandProcessor {
    const processor = this.processors.get(type);
    if (!processor) {
      throw new Error(`No command processor found for device type: ${type}`);
    }
    return processor;
  }

  static processCommand(type: DeviceType, command: DeviceCommand): any {
    const processor = this.getProcessor(type);
    
    if (!processor.validateCommand(command)) {
      throw new Error(`Invalid command format for device type: ${type}`);
    }
    
    return processor.processCommand(command);
  }
} 