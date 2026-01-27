import Purchases, {
  CustomerInfo,
  PurchasesError,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAppStore } from '@/store/useAppStore';

export interface SubscriptionPackage {
  identifier: string;
  title: string;
  description: string;
  priceString: string;
  price: number;
}

const REVENUECAT_API_KEY_IOS = Constants.expoConfig?.extra?.revenueCatApiKeyIos || '';
const REVENUECAT_API_KEY_ANDROID = Constants.expoConfig?.extra?.revenueCatApiKeyAndroid || '';
const ENTITLEMENT_ID = 'premium';

class SubscriptionService {
  private initialized = false;

  async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;

    try {
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

      if (!apiKey) {
        console.warn('RevenueCat API key not configured');
        return;
      }

      Purchases.configure({ apiKey });

      if (userId) {
        await Purchases.logIn(userId);
      }

      this.initialized = true;

      // Check current subscription status
      await this.checkSubscriptionStatus();

      // Listen for changes
      Purchases.addCustomerInfoUpdateListener(this.handleCustomerInfoUpdate);
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
    }
  }

  async getPackages(): Promise<SubscriptionPackage[]> {
    try {
      const offerings = await Purchases.getOfferings();

      if (!offerings.current) {
        return this.getMockPackages();
      }

      return offerings.current.availablePackages.map((pkg) => ({
        identifier: pkg.identifier,
        title: pkg.product.title,
        description: pkg.product.description,
        priceString: pkg.product.priceString,
        price: pkg.product.price,
      }));
    } catch (error) {
      console.error('Failed to get packages:', error);
      return this.getMockPackages();
    }
  }

  private getMockPackages(): SubscriptionPackage[] {
    return [
      {
        identifier: 'boxcoach.monthly',
        title: 'Monthly',
        description: 'Monthly subscription',
        priceString: '$9.99',
        price: 9.99,
      },
      {
        identifier: 'boxcoach.annual',
        title: 'Annual',
        description: 'Annual subscription - Save 50%',
        priceString: '$59.99',
        price: 59.99,
      },
    ];
  }

  async purchase(packageIdentifier: string): Promise<boolean> {
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        (p) => p.identifier === packageIdentifier
      );

      if (!pkg) {
        console.error('Package not found:', packageIdentifier);
        return false;
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return this.hasActiveEntitlement(customerInfo);
    } catch (error) {
      const purchasesError = error as PurchasesError;
      if (purchasesError.userCancelled) {
        return false;
      }
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  async restore(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasEntitlement = this.hasActiveEntitlement(customerInfo);
      useAppStore.getState().setIsPremium(hasEntitlement);
      return hasEntitlement;
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isPremium = this.hasActiveEntitlement(customerInfo);
      useAppStore.getState().setIsPremium(isPremium);
      return isPremium;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  private hasActiveEntitlement(customerInfo: CustomerInfo): boolean {
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  }

  private handleCustomerInfoUpdate = (customerInfo: CustomerInfo) => {
    const isPremium = this.hasActiveEntitlement(customerInfo);
    useAppStore.getState().setIsPremium(isPremium);
  };

  async setUserId(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
    } catch (error) {
      console.error('Failed to set RevenueCat user ID:', error);
    }
  }

  async logout(): Promise<void> {
    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('Failed to logout from RevenueCat:', error);
    }
  }
}

export const subscriptionService = new SubscriptionService();
