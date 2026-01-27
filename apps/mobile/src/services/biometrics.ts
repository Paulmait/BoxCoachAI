import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

interface BiometricResult {
  success: boolean;
  error?: string;
}

interface StoredCredentials {
  email: string;
  password: string;
}

const CREDENTIALS_KEY = 'boxcoach_biometric_credentials';

class BiometricsService {
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return false;

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return isEnrolled;
    } catch (error) {
      console.error('Biometrics availability check failed:', error);
      return false;
    }
  }

  async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Failed to get supported auth types:', error);
      return [];
    }
  }

  async authenticate(promptMessage?: string): Promise<BiometricResult> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Authenticate to continue',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  async storeCredentials(email: string, password: string): Promise<boolean> {
    try {
      const credentials: StoredCredentials = { email, password };
      await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
      return true;
    } catch (error) {
      console.error('Failed to store credentials:', error);
      return false;
    }
  }

  async getStoredCredentials(): Promise<StoredCredentials | null> {
    try {
      const data = await SecureStore.getItemAsync(CREDENTIALS_KEY);
      if (!data) return null;
      return JSON.parse(data) as StoredCredentials;
    } catch (error) {
      console.error('Failed to get stored credentials:', error);
      return null;
    }
  }

  async clearCredentials(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    } catch (error) {
      console.error('Failed to clear credentials:', error);
    }
  }

  getBiometricTypeName(types: LocalAuthentication.AuthenticationType[]): string {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    return 'Biometrics';
  }
}

export const biometricsService = new BiometricsService();
