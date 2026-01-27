/**
 * Analytics Service for BoxCoach AI
 * Tracks user behavior for product insights and acquisition due diligence
 */

import { supabase } from './supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'boxcoach_session';
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

interface SessionData {
  sessionId: string;
  startTime: number;
  screensViewed: number;
  actionsTaken: number;
}

class AnalyticsService {
  private userId: string | null = null;
  private sessionData: SessionData | null = null;

  /**
   * Initialize analytics with user ID
   */
  async init(userId: string) {
    this.userId = userId;
    await this.startSession();
  }

  /**
   * Start a new session
   */
  private async startSession() {
    if (!this.userId) return;

    this.sessionData = {
      sessionId: crypto.randomUUID(),
      startTime: Date.now(),
      screensViewed: 0,
      actionsTaken: 0,
    };

    // Save session start to database
    await supabase.from('user_sessions').insert({
      id: this.sessionData.sessionId,
      user_id: this.userId,
      session_start: new Date().toISOString(),
      device_info: {
        platform: Platform.OS,
        version: Platform.Version,
      },
      app_version: APP_VERSION,
    });

    // Store in AsyncStorage for persistence
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(this.sessionData));
  }

  /**
   * End the current session
   */
  async endSession() {
    if (!this.sessionData || !this.userId) return;

    const duration = Math.floor((Date.now() - this.sessionData.startTime) / 1000);

    await supabase
      .from('user_sessions')
      .update({
        session_end: new Date().toISOString(),
        duration_seconds: duration,
        screens_viewed: this.sessionData.screensViewed,
        actions_taken: this.sessionData.actionsTaken,
      })
      .eq('id', this.sessionData.sessionId);

    this.sessionData = null;
    await AsyncStorage.removeItem(SESSION_KEY);
  }

  /**
   * Track a custom event
   */
  async trackEvent(event: string, properties?: Record<string, unknown>) {
    if (!this.userId) return;

    if (this.sessionData) {
      this.sessionData.actionsTaken++;
    }

    await supabase.from('analytics_events').insert({
      user_id: this.userId,
      event,
      properties: properties || null,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track screen view
   */
  async trackScreen(screenName: string) {
    if (!this.userId) return;

    if (this.sessionData) {
      this.sessionData.screensViewed++;
    }

    await this.trackEvent('screen_view', { screen: screenName });
  }

  /**
   * Track feature usage (for product analytics)
   */
  async trackFeature(featureName: string, metadata?: Record<string, unknown>) {
    if (!this.userId) return;

    // Use the database function for upsert
    await supabase.rpc('track_feature_usage', {
      p_user_id: this.userId,
      p_feature: featureName,
      p_metadata: metadata || null,
    });
  }

  // ==========================================
  // Pre-defined events for consistent tracking
  // ==========================================

  async trackSignup(source: string = 'organic') {
    await this.trackEvent('signup', { source, platform: Platform.OS });
  }

  async trackLogin() {
    await this.trackEvent('login', { platform: Platform.OS });
  }

  async trackAnalysisStarted() {
    await this.trackEvent('analysis_started');
    await this.trackFeature('video_analysis');
  }

  async trackAnalysisCompleted(score: number, duration: number) {
    await this.trackEvent('analysis_completed', { score, duration_ms: duration });
  }

  async trackDrillStarted(drillId: string, drillName: string) {
    await this.trackEvent('drill_started', { drill_id: drillId, drill_name: drillName });
    await this.trackFeature('drills');
  }

  async trackDrillCompleted(drillId: string, duration: number, rating?: number) {
    await this.trackEvent('drill_completed', { drill_id: drillId, duration, rating });
  }

  async trackTimerUsed(duration: number, rounds: number) {
    await this.trackEvent('timer_used', { duration, rounds });
    await this.trackFeature('timer');
  }

  async trackComboGenerated() {
    await this.trackEvent('combo_generated');
    await this.trackFeature('combo_randomizer');
  }

  async trackWeightLogged(weight: number, unit: string) {
    await this.trackEvent('weight_logged', { weight, unit });
    await this.trackFeature('weight_tracker');
  }

  async trackJournalEntry() {
    await this.trackEvent('journal_entry_created');
    await this.trackFeature('journal');
  }

  async trackPlanStarted(planId: string) {
    await this.trackEvent('training_plan_started', { plan_id: planId });
    await this.trackFeature('training_plans');
  }

  async trackShareAction(contentType: string) {
    await this.trackEvent('content_shared', { content_type: contentType });
  }

  async trackPaywallViewed(source: string) {
    await this.trackEvent('paywall_viewed', { source });
  }

  async trackSubscriptionStarted(productId: string, price: number) {
    await this.trackEvent('subscription_started', { product_id: productId, price });
  }

  async trackError(errorType: string, message: string, context?: Record<string, unknown>) {
    await this.trackEvent('error', { error_type: errorType, message, ...context });
  }

  /**
   * Clear analytics state (on logout)
   */
  async clear() {
    await this.endSession();
    this.userId = null;
  }
}

export const analytics = new AnalyticsService();
