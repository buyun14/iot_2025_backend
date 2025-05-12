import { DeviceType, DeviceState } from '../models/smartDeviceModel';

// 验证错误接口
interface ValidationError {
  field: string;
  message: string;
}

// 基础状态验证器
abstract class BaseStateValidator {
  protected abstract readonly type: DeviceType;

  validateState(state: DeviceState): ValidationError[] {
    const errors: ValidationError[] = [];

    // 验证基础字段
    if (typeof state.online !== 'boolean') {
      errors.push({
        field: 'online',
        message: 'online must be a boolean'
      });
    }

    if (!(state.lastUpdate instanceof Date)) {
      errors.push({
        field: 'lastUpdate',
        message: 'lastUpdate must be a Date'
      });
    }

    if (state.errorState !== null && typeof state.errorState !== 'string') {
      errors.push({
        field: 'errorState',
        message: 'errorState must be null or a string'
      });
    }

    // 验证设备特定字段
    return [...errors, ...this.validateDeviceSpecificState(state)];
  }

  protected abstract validateDeviceSpecificState(state: any): ValidationError[];
}

// 智能灯状态验证器
class LightStateValidator extends BaseStateValidator {
  protected readonly type = DeviceType.LIGHT;

  protected validateDeviceSpecificState(state: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (state.state !== 'on' && state.state !== 'off') {
      errors.push({
        field: 'state',
        message: 'state must be "on" or "off"'
      });
    }

    const brightness = Number(state.brightness);
    if (isNaN(brightness) || brightness < 0 || brightness > 100) {
      errors.push({
        field: 'brightness',
        message: 'brightness must be a number between 0 and 100'
      });
    }

    const colorTemp = Number(state.color_temp);
    if (isNaN(colorTemp) || colorTemp < 2700 || colorTemp > 6500) {
      errors.push({
        field: 'color_temp',
        message: 'color_temp must be a number between 2700 and 6500'
      });
    }

    const powerConsumption = Number(state.power_consumption);
    if (isNaN(powerConsumption) || powerConsumption < 0) {
      errors.push({
        field: 'power_consumption',
        message: 'power_consumption must be a non-negative number'
      });
    }

    return errors;
  }
}

// 温控器状态验证器
class ThermostatStateValidator extends BaseStateValidator {
  protected readonly type = DeviceType.THERMOSTAT;

  protected validateDeviceSpecificState(state: any): ValidationError[] {
    const errors: ValidationError[] = [];

    const currentTemp = Number(state.current_temp);
    if (isNaN(currentTemp)) {
      errors.push({
        field: 'current_temp',
        message: 'current_temp must be a number'
      });
    }

    const targetTemp = Number(state.target_temp);
    if (isNaN(targetTemp) || targetTemp < 16 || targetTemp > 30) {
      errors.push({
        field: 'target_temp',
        message: 'target_temp must be a number between 16 and 30'
      });
    }

    const humidity = Number(state.humidity);
    if (isNaN(humidity) || humidity < 0 || humidity > 100) {
      errors.push({
        field: 'humidity',
        message: 'humidity must be a number between 0 and 100'
      });
    }

    if (!['auto', 'heat', 'cool'].includes(state.mode)) {
      errors.push({
        field: 'mode',
        message: 'mode must be one of: auto, heat, cool'
      });
    }

    if (!['auto', 'low', 'medium', 'high'].includes(state.fan_speed)) {
      errors.push({
        field: 'fan_speed',
        message: 'fan_speed must be one of: auto, low, medium, high'
      });
    }

    return errors;
  }
}

// 门锁状态验证器
class DoorLockStateValidator extends BaseStateValidator {
  protected readonly type = DeviceType.DOOR_LOCK;

  protected validateDeviceSpecificState(state: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (typeof state.locked !== 'boolean') {
      errors.push({
        field: 'locked',
        message: 'locked must be a boolean'
      });
    }

    const batteryLevel = Number(state.battery_level);
    if (isNaN(batteryLevel) || batteryLevel < 0 || batteryLevel > 100) {
      errors.push({
        field: 'battery_level',
        message: 'battery_level must be a number between 0 and 100'
      });
    }

    if (state.last_lock_time && !(state.last_lock_time instanceof Date)) {
      errors.push({
        field: 'last_lock_time',
        message: 'last_lock_time must be a Date'
      });
    }

    if (state.last_unlock_time && !(state.last_unlock_time instanceof Date)) {
      errors.push({
        field: 'last_unlock_time',
        message: 'last_unlock_time must be a Date'
      });
    }

    return errors;
  }
}

// 窗帘状态验证器
class BlindStateValidator extends BaseStateValidator {
  protected readonly type = DeviceType.BLIND;

  protected validateDeviceSpecificState(state: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // 验证位置
    if ('position' in state) {
      const position = Number(state.position);
      if (isNaN(position) || position < 0 || position > 100) {
        errors.push({
          field: 'position',
          message: 'position must be a number between 0 and 100'
        });
      }
    } else {
      errors.push({
        field: 'position',
        message: 'position is required'
      });
    }

    // 验证倾斜角度
    if ('tilt' in state) {
      const tilt = Number(state.tilt);
      if (isNaN(tilt) || tilt < 0 || tilt > 180) {
        errors.push({
          field: 'tilt',
          message: 'tilt must be a number between 0 and 180'
        });
      }
    } else {
      errors.push({
        field: 'tilt',
        message: 'tilt is required'
      });
    }

    // 验证移动状态
    if ('moving' in state) {
      if (typeof state.moving !== 'boolean') {
        errors.push({
          field: 'moving',
          message: 'moving must be a boolean'
        });
      }
    } else {
      errors.push({
        field: 'moving',
        message: 'moving is required'
      });
    }

    // 验证最后移动时间
    if ('last_move_time' in state) {
      const lastMoveTime = new Date(state.last_move_time);
      if (isNaN(lastMoveTime.getTime())) {
        errors.push({
          field: 'last_move_time',
          message: 'last_move_time must be a valid date'
        });
      }
    } else {
      errors.push({
        field: 'last_move_time',
        message: 'last_move_time is required'
      });
    }

    return errors;
  }
}

// 空调状态验证器
class AirConditionerStateValidator extends BaseStateValidator {
  protected readonly type = DeviceType.AIR_CONDITIONER;

  protected validateDeviceSpecificState(state: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (typeof state.on !== 'boolean') {
      errors.push({
        field: 'on',
        message: 'on must be a boolean'
      });
    }

    const temp = Number(state.temp);
    if (isNaN(temp) || temp < 16 || temp > 30) {
      errors.push({
        field: 'temp',
        message: 'temp must be a number between 16 and 30'
      });
    }

    if (!['cool', 'heat', 'dry', 'fan'].includes(state.mode)) {
      errors.push({
        field: 'mode',
        message: 'mode must be one of: cool, heat, dry, fan'
      });
    }

    if (!['auto', 'low', 'medium', 'high'].includes(state.fan_speed)) {
      errors.push({
        field: 'fan_speed',
        message: 'fan_speed must be one of: auto, low, medium, high'
      });
    }

    if (typeof state.swing !== 'boolean') {
      errors.push({
        field: 'swing',
        message: 'swing must be a boolean'
      });
    }

    const powerConsumption = Number(state.power_consumption);
    if (isNaN(powerConsumption) || powerConsumption < 0) {
      errors.push({
        field: 'power_consumption',
        message: 'power_consumption must be a non-negative number'
      });
    }

    return errors;
  }
}

// 烟雾报警器状态验证器
class SmokeDetectorStateValidator extends BaseStateValidator {
  protected readonly type = DeviceType.SMOKE_DETECTOR;

  protected validateDeviceSpecificState(state: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (typeof state.alarm !== 'boolean') {
      errors.push({
        field: 'alarm',
        message: 'alarm must be a boolean'
      });
    }

    const batteryLevel = Number(state.battery_level);
    if (isNaN(batteryLevel) || batteryLevel < 0 || batteryLevel > 100) {
      errors.push({
        field: 'battery_level',
        message: 'battery_level must be a number between 0 and 100'
      });
    }

    const smokeLevel = Number(state.smoke_level);
    if (isNaN(smokeLevel) || smokeLevel < 0 || smokeLevel > 100) {
      errors.push({
        field: 'smoke_level',
        message: 'smoke_level must be a number between 0 and 100'
      });
    }

    if (state.last_test_time && !(state.last_test_time instanceof Date)) {
      errors.push({
        field: 'last_test_time',
        message: 'last_test_time must be a Date'
      });
    }

    return errors;
  }
}

// 风扇状态验证器
class FanStateValidator extends BaseStateValidator {
  protected readonly type = DeviceType.FAN;

  protected validateDeviceSpecificState(state: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (typeof state.on !== 'boolean') {
      errors.push({
        field: 'on',
        message: 'on must be a boolean'
      });
    }

    const speed = Number(state.speed);
    if (isNaN(speed) || speed < 1 || speed > 3) {
      errors.push({
        field: 'speed',
        message: 'speed must be a number between 1 and 3'
      });
    }

    if (typeof state.oscillate !== 'boolean') {
      errors.push({
        field: 'oscillate',
        message: 'oscillate must be a boolean'
      });
    }

    const timer = Number(state.timer);
    if (isNaN(timer) || timer < 0 || timer > 120) {
      errors.push({
        field: 'timer',
        message: 'timer must be a number between 0 and 120'
      });
    }

    const powerConsumption = Number(state.power_consumption);
    if (isNaN(powerConsumption) || powerConsumption < 0) {
      errors.push({
        field: 'power_consumption',
        message: 'power_consumption must be a non-negative number'
      });
    }

    return errors;
  }
}

// 智能插座状态验证器
class PlugStateValidator extends BaseStateValidator {
  protected readonly type = DeviceType.PLUG;

  protected validateDeviceSpecificState(state: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (typeof state.on !== 'boolean') {
      errors.push({
        field: 'on',
        message: 'on must be a boolean'
      });
    }

    const powerConsumption = Number(state.power_consumption);
    if (isNaN(powerConsumption) || powerConsumption < 0) {
      errors.push({
        field: 'power_consumption',
        message: 'power_consumption must be a non-negative number'
      });
    }

    const voltage = Number(state.voltage);
    if (isNaN(voltage) || voltage < 100 || voltage > 240) {
      errors.push({
        field: 'voltage',
        message: 'voltage must be a number between 100 and 240'
      });
    }

    const current = Number(state.current);
    if (isNaN(current) || current < 0) {
      errors.push({
        field: 'current',
        message: 'current must be a non-negative number'
      });
    }

    const powerFactor = Number(state.power_factor);
    if (isNaN(powerFactor) || powerFactor < 0.8 || powerFactor > 1) {
      errors.push({
        field: 'power_factor',
        message: 'power_factor must be a number between 0.8 and 1'
      });
    }

    const timer = Number(state.timer);
    if (isNaN(timer) || timer < 0 || timer > 120) {
      errors.push({
        field: 'timer',
        message: 'timer must be a number between 0 and 120'
      });
    }

    return errors;
  }
}

// 状态验证器工厂
export class DeviceStateValidatorFactory {
  private static validators: Map<DeviceType, BaseStateValidator> = new Map();

  static {
    // 注册所有设备类型的验证器
    this.validators.set(DeviceType.LIGHT, new LightStateValidator());
    this.validators.set(DeviceType.THERMOSTAT, new ThermostatStateValidator());
    this.validators.set(DeviceType.DOOR_LOCK, new DoorLockStateValidator());
    this.validators.set(DeviceType.BLIND, new BlindStateValidator());
    this.validators.set(DeviceType.AIR_CONDITIONER, new AirConditionerStateValidator());
    this.validators.set(DeviceType.SMOKE_DETECTOR, new SmokeDetectorStateValidator());
    this.validators.set(DeviceType.FAN, new FanStateValidator());
    this.validators.set(DeviceType.PLUG, new PlugStateValidator());
  }

  static getValidator(type: DeviceType): BaseStateValidator {
    const validator = this.validators.get(type);
    if (!validator) {
      throw new Error(`No validator found for device type: ${type}`);
    }
    return validator;
  }

  static getValidationErrors(type: DeviceType, state: DeviceState): ValidationError[] {
    const validator = this.getValidator(type);
    return validator.validateState(state);
  }
} 