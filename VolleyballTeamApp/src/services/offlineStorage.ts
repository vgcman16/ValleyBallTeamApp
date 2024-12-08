import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';
import { TABLES } from '../constants/supabase';

type SyncItem = {
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
};

const SYNC_QUEUE_KEY = 'syncQueue';
const LAST_SYNC_KEY = 'lastSync';
const CACHE_PREFIX = 'cache_';

export class OfflineStorage {
  private static instance: OfflineStorage;
  private syncQueue: SyncItem[] = [];
  private isOnline: boolean = true;

  private constructor() {
    this.initializeNetworkListener();
    this.loadSyncQueue();
  }

  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        this.syncWithServer();
      }
    });
  }

  private async loadSyncQueue() {
    try {
      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }

  private async saveSyncQueue() {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  async cacheData(table: string, data: any) {
    try {
      await AsyncStorage.setItem(`${CACHE_PREFIX}${table}`, JSON.stringify(data));
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  async getCachedData(table: string): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(`${CACHE_PREFIX}${table}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  async queueOperation(table: string, operation: SyncItem['operation'], data: any) {
    this.syncQueue.push({
      table,
      operation,
      data,
      timestamp: Date.now(),
    });
    await this.saveSyncQueue();

    if (this.isOnline) {
      await this.syncWithServer();
    }
  }

  async syncWithServer() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const operations = [...this.syncQueue];
    this.syncQueue = [];
    await this.saveSyncQueue();

    for (const operation of operations) {
      try {
        switch (operation.operation) {
          case 'INSERT':
            await supabase.from(operation.table).insert(operation.data);
            break;
          case 'UPDATE':
            await supabase
              .from(operation.table)
              .update(operation.data)
              .eq('id', operation.data.id);
            break;
          case 'DELETE':
            await supabase
              .from(operation.table)
              .delete()
              .eq('id', operation.data.id);
            break;
        }
      } catch (error) {
        console.error('Error syncing operation:', error);
        // Re-queue failed operations
        this.syncQueue.push(operation);
        await this.saveSyncQueue();
      }
    }
  }

  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async getLastSyncTime(): Promise<number | null> {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return lastSync ? parseInt(lastSync) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }
}
