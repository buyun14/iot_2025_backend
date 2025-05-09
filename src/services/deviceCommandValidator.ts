import { DeviceType, DeviceCommand } from '../models/smartDeviceModel';

// 命令验证错误接口
interface CommandValidationError {
  field: string;
  message: string;
}

// 基础命令验证器
abstract class BaseCommandValidator {
  protected abstract readonly type: DeviceType;
  protected abstract readonly supportedCommands: string[];

  validateCommand(command: DeviceCommand): CommandValidationError[] {
    const errors: CommandValidationError[] = [];

    // 验证基础字段
    if (!command || typeof command !== 'object') {
      errors.push({
        field: 'command',
        message: 'command must be an object'
      });
      return errors;
    }

    if (!command.command || typeof command.command !== 'string') {
      errors.push({
        field: 'command',
        message: 'command must be a string'
      });
      return errors;
    }

    if (!this.supportedCommands.includes(command.command)) {
      errors.push({
        field: 'command',
        message: `command must be one of: ${this.supportedCommands.join(', ')}`
      });
      return errors;
    }

    // 验证命令特定参数
    return [...errors, ...this.validateCommandParams(command)];
  }

  protected abstract validateCommandParams(command: DeviceCommand): CommandValidationError[];
}

// 智能灯命令验证器
class LightCommandValidator extends BaseCommandValidator {
  protected readonly type = DeviceType.LIGHT;
  protected readonly supportedCommands = ['turn_on', 'turn_off', 'set_brightness', 'set_color_temp'];

  protected validateCommandParams(command: DeviceCommand): CommandValidationError[] {
    const errors: CommandValidationError[] = [];

    switch (command.command) {
      case 'set_brightness':
        const brightness = Number(command.params?.brightness);
        if (isNaN(brightness) || brightness < 0 || brightness > 100) {
          errors.push({
            field: 'brightness',
            message: 'brightness must be a number between 0 and 100'
          });
        }
        break;

      case 'set_color_temp':
        const colorTemp = Number(command.params?.color_temp);
        if (isNaN(colorTemp) || colorTemp < 2700 || colorTemp > 6500) {
          errors.push({
            field: 'color_temp',
            message: 'color_temp must be a number between 2700 and 6500'
          });
        }
        break;
    }

    return errors;
  }
}

// 温控器命令验证器
class ThermostatCommandValidator extends BaseCommandValidator {
  protected readonly type = DeviceType.THERMOSTAT;
  protected readonly supportedCommands = ['set_target_temp', 'set_mode', 'set_fan_speed'];

  protected validateCommandParams(command: DeviceCommand): CommandValidationError[] {
    const errors: CommandValidationError[] = [];

    switch (command.command) {
      case 'set_target_temp':
        const temp = Number(command.params?.temperature);
        if (isNaN(temp) || temp < 16 || temp > 30) {
          errors.push({
            field: 'temperature',
            message: 'temperature must be a number between 16 and 30'
          });
        }
        break;

      case 'set_mode':
        if (!['auto', 'heat', 'cool'].includes(command.params?.mode)) {
          errors.push({
            field: 'mode',
            message: 'mode must be one of: auto, heat, cool'
          });
        }
        break;

      case 'set_fan_speed':
        if (!['auto', 'low', 'medium', 'high'].includes(command.params?.speed)) {
          errors.push({
            field: 'speed',
            message: 'speed must be one of: auto, low, medium, high'
          });
        }
        break;
    }

    return errors;
  }
}

// 门锁命令验证器
class DoorLockCommandValidator extends BaseCommandValidator {
  protected readonly type = DeviceType.DOOR_LOCK;
  protected readonly supportedCommands = ['lock', 'unlock'];

  protected validateCommandParams(_command: DeviceCommand): CommandValidationError[] {
    return [];  // 无需额外参数
  }
}

// 窗帘命令验证器
class BlindCommandValidator extends BaseCommandValidator {
  protected readonly type = DeviceType.BLIND;
  protected readonly supportedCommands = ['open', 'close', 'set_position', 'set_tilt'];

  protected validateCommandParams(command: DeviceCommand): CommandValidationError[] {
    const errors: CommandValidationError[] = [];

    switch (command.command) {
      case 'set_position':
        const position = Number(command.params?.position);
        if (isNaN(position) || position < 0 || position > 100) {
          errors.push({
            field: 'position',
            message: 'position must be a number between 0 and 100'
          });
        }
        break;

      case 'set_tilt':
        const tilt = Number(command.params?.tilt);
        if (isNaN(tilt) || tilt < 0 || tilt > 180) {
          errors.push({
            field: 'tilt',
            message: 'tilt must be a number between 0 and 180'
          });
        }
        break;
    }

    return errors;
  }
}

// 空调命令验证器
class AirConditionerCommandValidator extends BaseCommandValidator {
  protected readonly type = DeviceType.AIR_CONDITIONER;
  protected readonly supportedCommands = ['turn_on', 'turn_off', 'set_temp', 'set_mode', 'set_fan_speed', 'toggle_swing'];

  protected validateCommandParams(command: DeviceCommand): CommandValidationError[] {
    const errors: CommandValidationError[] = [];

    switch (command.command) {
      case 'set_temp':
        const temp = Number(command.params?.temp);
        if (isNaN(temp) || temp < 16 || temp > 30) {
          errors.push({
            field: 'temp',
            message: 'temp must be a number between 16 and 30'
          });
        }
        break;

      case 'set_mode':
        if (!['cool', 'heat', 'dry', 'fan'].includes(command.params?.mode)) {
          errors.push({
            field: 'mode',
            message: 'mode must be one of: cool, heat, dry, fan'
          });
        }
        break;

      case 'set_fan_speed':
        if (!['auto', 'low', 'medium', 'high'].includes(command.params?.fan_speed)) {
          errors.push({
            field: 'fan_speed',
            message: 'fan_speed must be one of: auto, low, medium, high'
          });
        }
        break;
    }

    return errors;
  }
}

// 烟雾报警器命令验证器
class SmokeDetectorCommandValidator extends BaseCommandValidator {
  protected readonly type = DeviceType.SMOKE_DETECTOR;
  protected readonly supportedCommands = ['reset', 'test'];

  protected validateCommandParams(_command: DeviceCommand): CommandValidationError[] {
    return [];  // 无需额外参数
  }
}

// 风扇命令验证器
class FanCommandValidator extends BaseCommandValidator {
  protected readonly type = DeviceType.FAN;
  protected readonly supportedCommands = ['turn_on', 'turn_off', 'set_speed', 'toggle_oscillate', 'set_timer'];

  protected validateCommandParams(command: DeviceCommand): CommandValidationError[] {
    const errors: CommandValidationError[] = [];

    switch (command.command) {
      case 'set_speed':
        const speed = Number(command.params?.speed);
        if (isNaN(speed) || speed < 1 || speed > 3) {
          errors.push({
            field: 'speed',
            message: 'speed must be a number between 1 and 3'
          });
        }
        break;

      case 'set_timer':
        const timer = Number(command.params?.minutes);
        if (isNaN(timer) || timer < 0 || timer > 120) {
          errors.push({
            field: 'minutes',
            message: 'minutes must be a number between 0 and 120'
          });
        }
        break;
    }

    return errors;
  }
}

// 智能插座命令验证器
class PlugCommandValidator extends BaseCommandValidator {
  protected readonly type = DeviceType.PLUG;
  protected readonly supportedCommands = ['turn_on', 'turn_off', 'set_timer'];

  protected validateCommandParams(command: DeviceCommand): CommandValidationError[] {
    const errors: CommandValidationError[] = [];

    if (command.command === 'set_timer') {
      const timer = Number(command.params?.minutes);
      if (isNaN(timer) || timer < 0 || timer > 120) {
        errors.push({
          field: 'minutes',
          message: 'minutes must be a number between 0 and 120'
        });
      }
    }

    return errors;
  }
}

// 命令验证器工厂
export class DeviceCommandValidatorFactory {
  private static validators: Map<DeviceType, BaseCommandValidator> = new Map();

  static {
    // 注册所有设备类型的验证器
    this.validators.set(DeviceType.LIGHT, new LightCommandValidator());
    this.validators.set(DeviceType.THERMOSTAT, new ThermostatCommandValidator());
    this.validators.set(DeviceType.DOOR_LOCK, new DoorLockCommandValidator());
    this.validators.set(DeviceType.BLIND, new BlindCommandValidator());
    this.validators.set(DeviceType.AIR_CONDITIONER, new AirConditionerCommandValidator());
    this.validators.set(DeviceType.SMOKE_DETECTOR, new SmokeDetectorCommandValidator());
    this.validators.set(DeviceType.FAN, new FanCommandValidator());
    this.validators.set(DeviceType.PLUG, new PlugCommandValidator());
  }

  static getValidator(type: DeviceType): BaseCommandValidator {
    const validator = this.validators.get(type);
    if (!validator) {
      throw new Error(`No command validator found for device type: ${type}`);
    }
    return validator;
  }

  static getValidationErrors(type: DeviceType, command: DeviceCommand): CommandValidationError[] {
    const validator = this.getValidator(type);
    return validator.validateCommand(command);
  }
} 