import { 
  DeviceType, 
  DeviceState, 
  BaseDeviceState,
  LightState,
  ThermostatState,
  DoorLockState,
  BlindState,
  AirConditionerState,
  SmokeDetectorState,
  FanState,
  PlugState
} from '../models/smartDeviceModel';

// 设备状态处理器接口
interface DeviceStateProcessor {
  processState(rawState: any): DeviceState;
  validateState(state: DeviceState): boolean;
}

// 基础设备状态处理器
abstract class BaseDeviceStateProcessor implements DeviceStateProcessor {
  protected abstract readonly type: DeviceType;
  protected abstract readonly requiredFields: string[];

  processState(rawState: any): DeviceState {
    // 创建基础状态
    const baseState: BaseDeviceState = {
      online: Boolean(rawState.online),
      lastUpdate: new Date(rawState.last_update || rawState.lastUpdate || Date.now()),
      errorState: rawState.error_state || rawState.errorState || null
    };

    // 提取设备特定状态
    const deviceSpecificState = this.extractDeviceSpecificState(rawState);
    
    // 根据设备类型返回正确的状态对象
    switch (this.type) {
      case DeviceType.LIGHT:
        const brightness = Math.min(100, Math.max(0, Number(deviceSpecificState.brightness || 50)));
        const colorTemp = Math.min(6500, Math.max(2700, Number(deviceSpecificState.color_temp || 4000)));
        const powerConsumption = Math.max(0, Number(deviceSpecificState.power_consumption || 0));
        return {
          ...baseState,
          state: deviceSpecificState.state === 'on' ? 'on' : 'off',
          brightness,
          color_temp: colorTemp,
          power_consumption: powerConsumption
        } as LightState;
      case DeviceType.THERMOSTAT:
        return {
          ...baseState,
          current_temp: Number(deviceSpecificState.current_temp || 22),
          target_temp: Number(deviceSpecificState.target_temp || 24),
          humidity: Number(deviceSpecificState.humidity || 50),
          mode: deviceSpecificState.mode || 'auto',
          fan_speed: deviceSpecificState.fan_speed || 'auto'
        } as ThermostatState;
      case DeviceType.DOOR_LOCK:
        return {
          ...baseState,
          locked: Boolean(deviceSpecificState.locked),
          battery_level: Number(deviceSpecificState.battery_level || 100),
          last_lock_time: deviceSpecificState.last_lock_time ? new Date(deviceSpecificState.last_lock_time) : new Date(),
          last_unlock_time: deviceSpecificState.last_unlock_time ? new Date(deviceSpecificState.last_unlock_time) : new Date()
        } as DoorLockState;
      case DeviceType.BLIND:
        return {
          ...baseState,
          position: Number(deviceSpecificState.position || 0),
          tilt: Number(deviceSpecificState.tilt || 0),
          moving: Boolean(deviceSpecificState.moving),
          last_move_time: deviceSpecificState.last_move_time ? new Date(deviceSpecificState.last_move_time) : new Date()
        } as BlindState;
      case DeviceType.AIR_CONDITIONER:
        return {
          ...baseState,
          on: Boolean(deviceSpecificState.on),
          temp: Number(deviceSpecificState.temp || 26),
          mode: deviceSpecificState.mode || 'cool',
          fan_speed: deviceSpecificState.fan_speed || 'auto',
          swing: Boolean(deviceSpecificState.swing),
          power_consumption: Number(deviceSpecificState.power_consumption || 0)
        } as AirConditionerState;
      case DeviceType.SMOKE_DETECTOR:
        return {
          ...baseState,
          alarm: Boolean(deviceSpecificState.alarm),
          battery_level: Number(deviceSpecificState.battery_level || 100),
          smoke_level: Number(deviceSpecificState.smoke_level || 0),
          last_test_time: deviceSpecificState.last_test_time ? new Date(deviceSpecificState.last_test_time) : new Date()
        } as SmokeDetectorState;
      case DeviceType.FAN:
        return {
          ...baseState,
          on: Boolean(deviceSpecificState.on),
          speed: Number(deviceSpecificState.speed || 1),
          oscillate: Boolean(deviceSpecificState.oscillate),
          timer: Number(deviceSpecificState.timer || 0),
          power_consumption: Number(deviceSpecificState.power_consumption || 0)
        } as FanState;
      case DeviceType.PLUG:
        return {
          ...baseState,
          on: Boolean(deviceSpecificState.on),
          power_consumption: Number(deviceSpecificState.power_consumption || 0),
          voltage: Number(deviceSpecificState.voltage || 220),
          current: Number(deviceSpecificState.current || 0),
          power_factor: Number(deviceSpecificState.power_factor || 0.95),
          timer: Number(deviceSpecificState.timer || 0)
        } as PlugState;
      default:
        throw new Error(`Unsupported device type: ${this.type}`);
    }
  }

  validateState(state: DeviceState): boolean {
    // 检查基础字段
    if (typeof state.online !== 'boolean') {
      console.error('Invalid online state:', state.online);
      return false;
    }

    if (!(state.lastUpdate instanceof Date)) {
      console.error('Invalid lastUpdate:', state.lastUpdate);
      return false;
    }

    if (state.errorState !== null && typeof state.errorState !== 'string') {
      console.error('Invalid errorState:', state.errorState);
      return false;
    }

    // 检查设备特定字段
    return this.validateDeviceSpecificState(state);
  }

  protected validateDeviceSpecificState(state: any): boolean {
    // 检查必需字段是否存在
    const hasAllFields = this.requiredFields.every(field => field in state);
    if (!hasAllFields) {
      console.error('Missing required fields:', 
        this.requiredFields.filter(field => !(field in state)));
      return false;
    }

    // 根据设备类型验证字段值
    switch (this.type) {
      case DeviceType.LIGHT:
        return this.validateLightState(state);
      case DeviceType.THERMOSTAT:
        return this.validateThermostatState(state);
      case DeviceType.DOOR_LOCK:
        return this.validateDoorLockState(state);
      case DeviceType.BLIND:
        return this.validateBlindState(state);
      case DeviceType.AIR_CONDITIONER:
        return this.validateAirConditionerState(state);
      case DeviceType.SMOKE_DETECTOR:
        return this.validateSmokeDetectorState(state);
      case DeviceType.FAN:
        return this.validateFanState(state);
      case DeviceType.PLUG:
        return this.validatePlugState(state);
      default:
        return true;
    }
  }

  private validateLightState(state: any): boolean {
    if (state.state !== 'on' && state.state !== 'off') {
      console.error('Invalid light state:', state.state);
      return false;
    }

    const brightness = Number(state.brightness);
    if (isNaN(brightness) || brightness < 0 || brightness > 100) {
      console.error('Invalid brightness:', state.brightness);
      return false;
    }

    const colorTemp = Number(state.color_temp);
    if (isNaN(colorTemp) || colorTemp < 2700 || colorTemp > 6500) {
      console.error('Invalid color temperature:', state.color_temp);
      return false;
    }

    const powerConsumption = Number(state.power_consumption);
    if (isNaN(powerConsumption) || powerConsumption < 0) {
      console.error('Invalid power consumption:', state.power_consumption);
      return false;
    }

    return true;
  }

  private validateThermostatState(state: any): boolean {
    const currentTemp = Number(state.current_temp);
    if (isNaN(currentTemp) || currentTemp < 16 || currentTemp > 30) {
      console.error('Invalid current temperature:', state.current_temp);
      return false;
    }

    const targetTemp = Number(state.target_temp);
    if (isNaN(targetTemp) || targetTemp < 16 || targetTemp > 30) {
      console.error('Invalid target temperature:', state.target_temp);
      return false;
    }

    const humidity = Number(state.humidity);
    if (isNaN(humidity) || humidity < 0 || humidity > 100) {
      console.error('Invalid humidity:', state.humidity);
      return false;
    }

    if (!['auto', 'heat', 'cool'].includes(state.mode)) {
      console.error('Invalid mode:', state.mode);
      return false;
    }

    if (!['auto', 'low', 'medium', 'high'].includes(state.fan_speed)) {
      console.error('Invalid fan speed:', state.fan_speed);
      return false;
    }

    return true;
  }

  private validateDoorLockState(state: any): boolean {
    // 检查锁定状态
    if (typeof state.locked !== 'boolean') {
      console.error('Invalid locked state:', state.locked);
      return false;
    }

    const batteryLevel = Number(state.battery_level);
    if (isNaN(batteryLevel) || batteryLevel < 0 || batteryLevel > 100) {
      console.error('Invalid battery level:', state.battery_level);
      return false;
    }

    return true;
  }

  private validateBlindState(state: any): boolean {
    const position = Number(state.position);
    if (isNaN(position) || position < 0 || position > 100) {
      console.error('Invalid position:', state.position);
      return false;
    }

    const tilt = Number(state.tilt);
    if (isNaN(tilt) || tilt < 0 || tilt > 100) {
      console.error('Invalid tilt:', state.tilt);
      return false;
    }

    return true;
  }

  private validateAirConditionerState(state: any): boolean {
    // 检查开关状态
    if (typeof state.on !== 'boolean') {
      console.error('Invalid on state:', state.on);
      return false;
    }

    const temp = Number(state.temp);
    if (isNaN(temp) || temp < 16 || temp > 32) {
      console.error('Invalid temperature:', state.temp);
      return false;
    }

    const mode = state.mode;
    if (mode !== 'cool' && mode !== 'heat' && mode !== 'auto') {
      console.error('Invalid mode:', state.mode);
      return false;
    }

    const fanSpeed = state.fan_speed;
    if (fanSpeed !== 'auto' && fanSpeed !== 'low' && fanSpeed !== 'medium' && fanSpeed !== 'high') {
      console.error('Invalid fan speed:', state.fan_speed);
      return false;
    }

    // 检查摆风状态
    if (typeof state.swing !== 'boolean') {
      console.error('Invalid swing state:', state.swing);
      return false;
    }

    return true;
  }

  private validateSmokeDetectorState(state: any): boolean {
    // 检查报警状态
    if (typeof state.alarm !== 'boolean') {
      console.error('Invalid alarm state:', state.alarm);
      return false;
    }

    const batteryLevel = Number(state.battery_level);
    if (isNaN(batteryLevel) || batteryLevel < 0 || batteryLevel > 100) {
      console.error('Invalid battery level:', state.battery_level);
      return false;
    }

    const smokeLevel = Number(state.smoke_level);
    if (isNaN(smokeLevel) || smokeLevel < 0 || smokeLevel > 100) {
      console.error('Invalid smoke level:', state.smoke_level);
      return false;
    }

    return true;
  }

  private validateFanState(state: any): boolean {
    // 检查开关状态
    if (typeof state.on !== 'boolean') {
      console.error('Invalid on state:', state.on);
      return false;
    }

    const speed = Number(state.speed);
    if (isNaN(speed) || speed < 1 || speed > 3) {
      console.error('Invalid speed:', state.speed);
      return false;
    }

    // 检查摆头状态
    if (typeof state.oscillate !== 'boolean') {
      console.error('Invalid oscillate state:', state.oscillate);
      return false;
    }

    const timer = Number(state.timer);
    if (isNaN(timer) || timer < 0) {
      console.error('Invalid timer:', state.timer);
      return false;
    }

    return true;
  }

  private validatePlugState(state: any): boolean {
    // 检查开关状态
    if (typeof state.on !== 'boolean') {
      console.error('Invalid on state:', state.on);
      return false;
    }

    const powerConsumption = Number(state.power_consumption);
    if (isNaN(powerConsumption) || powerConsumption < 0) {
      console.error('Invalid power consumption:', state.power_consumption);
      return false;
    }

    const voltage = Number(state.voltage);
    if (isNaN(voltage) || voltage < 100 || voltage > 240) {
      console.error('Invalid voltage:', state.voltage);
      return false;
    }

    const current = Number(state.current);
    if (isNaN(current) || current < 0) {
      console.error('Invalid current:', state.current);
      return false;
    }

    const powerFactor = Number(state.power_factor);
    if (isNaN(powerFactor) || powerFactor < 0.8 || powerFactor > 1) {
      console.error('Invalid power factor:', state.power_factor);
      return false;
    }

    const timer = Number(state.timer);
    if (isNaN(timer) || timer < 0) {
      console.error('Invalid timer:', state.timer);
      return false;
    }

    return true;
  }

  protected extractDeviceSpecificState(rawState: any): any {
    // 移除基础状态字段
    const { type, online, last_update, lastUpdate, error_state, errorState, ...deviceSpecificState } = rawState;
    return deviceSpecificState;
  }

  // @ts-ignore
  private isValidStateFormat(state: any): boolean {
    if (!state || typeof state !== 'object') {
      return false;
    }

    // 检查基础字段
    const hasBaseFields = 
      'online' in state &&
      ('lastUpdate' in state || 'last_update' in state) &&
      ('errorState' in state || 'error_state' in state);

    if (!hasBaseFields) {
      return false;
    }

    // 检查设备特定字段
    return this.validateDeviceSpecificState(state);
  }
}

// 智能灯状态处理器
class LightStateProcessor extends BaseDeviceStateProcessor {
  protected readonly type = DeviceType.LIGHT;
  protected readonly requiredFields = ['state', 'brightness', 'color_temp', 'power_consumption'];

  protected extractDeviceSpecificState(rawState: any): Partial<DeviceState> {
    return {
      state: rawState.state,
      brightness: Number(rawState.brightness),
      color_temp: Number(rawState.color_temp),
      power_consumption: Number(rawState.power_consumption)
    };
  }
}

// 温控器状态处理器
class ThermostatStateProcessor extends BaseDeviceStateProcessor {
  protected readonly type = DeviceType.THERMOSTAT;
  protected readonly requiredFields = ['current_temp', 'target_temp', 'humidity', 'mode', 'fan_speed'];

  protected extractDeviceSpecificState(rawState: any): Partial<DeviceState> {
    return {
      current_temp: Number(rawState.current_temp || 22),
      target_temp: Number(rawState.target_temp || 24),
      humidity: Number(rawState.humidity || 50),
      mode: rawState.mode || 'auto',
      fan_speed: rawState.fan_speed || 'auto'
    };
  }

  protected processSpecificState(rawState: any): DeviceState {
    return {
      online: true,
      lastUpdate: new Date(),
      errorState: null,
      current_temp: Number(rawState.current_temp),
      target_temp: Number(rawState.target_temp),
      humidity: Number(rawState.humidity),
      mode: rawState.mode,
      fan_speed: rawState.fan_speed
    } as ThermostatState;
  }

  protected validateStateFormat(state: any): boolean {
    return (
      typeof state.current_temp !== 'undefined' &&
      typeof state.target_temp !== 'undefined' &&
      typeof state.humidity !== 'undefined' &&
      typeof state.mode === 'string' &&
      typeof state.fan_speed === 'string'
    );
  }
}

// 智能门锁状态处理器
class DoorLockStateProcessor extends BaseDeviceStateProcessor {
  protected readonly type = DeviceType.DOOR_LOCK;
  protected readonly requiredFields = ['locked', 'battery_level', 'last_lock_time', 'last_unlock_time'];

  protected extractDeviceSpecificState(rawState: any): Partial<DeviceState> {
    return {
      locked: Boolean(rawState.locked),
      battery_level: Number(rawState.battery_level),
      last_lock_time: new Date(rawState.last_lock_time),
      last_unlock_time: new Date(rawState.last_unlock_time)
    };
  }
}

// 智能窗帘状态处理器
class BlindStateProcessor extends BaseDeviceStateProcessor {
  protected readonly type = DeviceType.BLIND;
  protected readonly requiredFields = ['position', 'tilt', 'moving', 'last_move_time'];

  protected extractDeviceSpecificState(rawState: any): Partial<DeviceState> {
    // 确保所有数值都被正确转换
    const position = Math.min(100, Math.max(0, Number(rawState.position || 0)));
    const tilt = Math.min(180, Math.max(0, Number(rawState.tilt || 0)));
    const moving = Boolean(rawState.moving);
    const lastMoveTime = rawState.last_move_time ? new Date(rawState.last_move_time) : new Date();

    return {
      position,
      tilt,
      moving,
      last_move_time: lastMoveTime
    };
  }

  protected validateStateFormat(state: any): boolean {
    return (
      typeof state.position === 'number' &&
      state.position >= 0 &&
      state.position <= 100 &&
      typeof state.tilt === 'number' &&
      state.tilt >= 0 &&
      state.tilt <= 180 &&
      typeof state.moving === 'boolean' &&
      state.last_move_time instanceof Date
    );
  }
}

// 空调状态处理器
class AirConditionerStateProcessor extends BaseDeviceStateProcessor {
  protected readonly type = DeviceType.AIR_CONDITIONER;
  protected readonly requiredFields = ['on', 'temp', 'mode', 'fan_speed', 'swing', 'power_consumption'];

  protected extractDeviceSpecificState(rawState: any): Partial<DeviceState> {
    return {
      on: Boolean(rawState.on),
      temp: Number(rawState.temp),
      mode: rawState.mode,
      fan_speed: rawState.fan_speed,
      swing: Boolean(rawState.swing),
      power_consumption: Number(rawState.power_consumption)
    };
  }
}

// 烟雾报警器状态处理器
class SmokeDetectorStateProcessor extends BaseDeviceStateProcessor {
  protected readonly type = DeviceType.SMOKE_DETECTOR;
  protected readonly requiredFields = ['alarm', 'battery_level', 'smoke_level', 'last_test_time'];

  protected extractDeviceSpecificState(rawState: any): Partial<DeviceState> {
    return {
      alarm: Boolean(rawState.alarm),
      battery_level: Number(rawState.battery_level),
      smoke_level: Number(rawState.smoke_level),
      last_test_time: new Date(rawState.last_test_time)
    };
  }
}

// 风扇状态处理器
class FanStateProcessor extends BaseDeviceStateProcessor {
  protected readonly type = DeviceType.FAN;
  protected readonly requiredFields = ['on', 'speed', 'oscillate', 'timer', 'power_consumption'];

  protected extractDeviceSpecificState(rawState: any): Partial<DeviceState> {
    return {
      on: Boolean(rawState.on),
      speed: Number(rawState.speed),
      oscillate: Boolean(rawState.oscillate),
      timer: Number(rawState.timer),
      power_consumption: Number(rawState.power_consumption)
    };
  }
}

// 智能插座状态处理器
class PlugStateProcessor extends BaseDeviceStateProcessor {
  protected readonly type = DeviceType.PLUG;
  protected readonly requiredFields = ['on', 'power_consumption', 'voltage', 'current', 'power_factor', 'timer'];

  protected extractDeviceSpecificState(rawState: any): Partial<DeviceState> {
    return {
      on: Boolean(rawState.on),
      power_consumption: Number(rawState.power_consumption),
      voltage: Number(rawState.voltage),
      current: Number(rawState.current),
      power_factor: Number(rawState.power_factor),
      timer: Number(rawState.timer)
    };
  }
}

// 设备状态处理器工厂
export class DeviceStateProcessorFactory {
  private static processors: Map<DeviceType, DeviceStateProcessor> = new Map();

  static {
    // 注册所有设备类型的处理器
    this.processors.set(DeviceType.LIGHT, new LightStateProcessor());
    this.processors.set(DeviceType.THERMOSTAT, new ThermostatStateProcessor());
    this.processors.set(DeviceType.DOOR_LOCK, new DoorLockStateProcessor());
    this.processors.set(DeviceType.BLIND, new BlindStateProcessor());
    this.processors.set(DeviceType.AIR_CONDITIONER, new AirConditionerStateProcessor());
    this.processors.set(DeviceType.SMOKE_DETECTOR, new SmokeDetectorStateProcessor());
    this.processors.set(DeviceType.FAN, new FanStateProcessor());
    this.processors.set(DeviceType.PLUG, new PlugStateProcessor());
  }

  static getProcessor(type: DeviceType): DeviceStateProcessor {
    const processor = this.processors.get(type);
    if (!processor) {
      throw new Error(`No processor found for device type: ${type}`);
    }
    return processor;
  }

  static processState(type: DeviceType, rawState: any): DeviceState {
    const processor = this.getProcessor(type);
    const state = processor.processState(rawState);
    
    if (!processor.validateState(state)) {
      throw new Error(`Invalid state format for device type: ${type}`);
    }
    
    return state;
  }
} 