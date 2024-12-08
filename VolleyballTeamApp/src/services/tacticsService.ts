import { supabase } from './supabase';
import { TABLES } from '../constants/supabase';

export type Position = {
  x: number;
  y: number;
  rotation: number;
  playerId?: string;
  role?: string;
};

export type Movement = {
  startPosition: Position;
  endPosition: Position;
  type: 'run' | 'pass' | 'attack' | 'serve' | 'block';
  playerId?: string;
};

export type Formation = {
  id: string;
  name: string;
  description?: string;
  positions: Position[];
  type: 'serve' | 'receive' | 'defense' | 'attack';
  tags?: string[];
  createdBy: string;
  createdAt: string;
};

export type Play = {
  id: string;
  name: string;
  description?: string;
  formations: Formation[];
  movements: Movement[];
  tags?: string[];
  createdBy: string;
  createdAt: string;
};

export type Rotation = {
  id: string;
  number: number;
  formation: Formation;
  substitutions?: {
    inPlayer: string;
    outPlayer: string;
    position: number;
  }[];
};

export class TacticsService {
  private static instance: TacticsService;

  private constructor() {}

  static getInstance(): TacticsService {
    if (!TacticsService.instance) {
      TacticsService.instance = new TacticsService();
    }
    return TacticsService.instance;
  }

  async createFormation(formation: Omit<Formation, 'id' | 'createdAt'>): Promise<Formation> {
    try {
      const { data, error } = await supabase
        .from(TABLES.FORMATIONS)
        .insert([{
          name: formation.name,
          description: formation.description,
          positions: formation.positions,
          type: formation.type,
          tags: formation.tags,
          created_by: formation.createdBy,
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        positions: data.positions,
        type: data.type,
        tags: data.tags,
        createdBy: data.created_by,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Error creating formation:', error);
      throw error;
    }
  }

  async getFormations(filters?: {
    type?: Formation['type'];
    tags?: string[];
    createdBy?: string;
  }): Promise<Formation[]> {
    try {
      let query = supabase
        .from(TABLES.FORMATIONS)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }
      if (filters?.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(formation => ({
        id: formation.id,
        name: formation.name,
        description: formation.description,
        positions: formation.positions,
        type: formation.type,
        tags: formation.tags,
        createdBy: formation.created_by,
        createdAt: formation.created_at,
      }));
    } catch (error) {
      console.error('Error fetching formations:', error);
      throw error;
    }
  }

  async createPlay(play: Omit<Play, 'id' | 'createdAt'>): Promise<Play> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYS)
        .insert([{
          name: play.name,
          description: play.description,
          formations: play.formations,
          movements: play.movements,
          tags: play.tags,
          created_by: play.createdBy,
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        formations: data.formations,
        movements: data.movements,
        tags: data.tags,
        createdBy: data.created_by,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Error creating play:', error);
      throw error;
    }
  }

  async getPlays(filters?: {
    tags?: string[];
    createdBy?: string;
  }): Promise<Play[]> {
    try {
      let query = supabase
        .from(TABLES.PLAYS)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }
      if (filters?.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(play => ({
        id: play.id,
        name: play.name,
        description: play.description,
        formations: play.formations,
        movements: play.movements,
        tags: play.tags,
        createdBy: play.created_by,
        createdAt: play.created_at,
      }));
    } catch (error) {
      console.error('Error fetching plays:', error);
      throw error;
    }
  }

  async createRotation(rotation: Omit<Rotation, 'id'>): Promise<Rotation> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ROTATIONS)
        .insert([{
          number: rotation.number,
          formation: rotation.formation,
          substitutions: rotation.substitutions,
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        number: data.number,
        formation: data.formation,
        substitutions: data.substitutions,
      };
    } catch (error) {
      console.error('Error creating rotation:', error);
      throw error;
    }
  }

  async getRotations(): Promise<Rotation[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ROTATIONS)
        .select('*')
        .order('number');

      if (error) throw error;

      return data.map(rotation => ({
        id: rotation.id,
        number: rotation.number,
        formation: rotation.formation,
        substitutions: rotation.substitutions,
      }));
    } catch (error) {
      console.error('Error fetching rotations:', error);
      throw error;
    }
  }

  async updateFormation(
    formationId: string,
    updates: Partial<Omit<Formation, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.FORMATIONS)
        .update(updates)
        .eq('id', formationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating formation:', error);
      throw error;
    }
  }

  async updatePlay(
    playId: string,
    updates: Partial<Omit<Play, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.PLAYS)
        .update(updates)
        .eq('id', playId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating play:', error);
      throw error;
    }
  }

  async updateRotation(
    rotationId: string,
    updates: Partial<Omit<Rotation, 'id'>>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.ROTATIONS)
        .update(updates)
        .eq('id', rotationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating rotation:', error);
      throw error;
    }
  }

  async deleteFormation(formationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.FORMATIONS)
        .delete()
        .eq('id', formationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting formation:', error);
      throw error;
    }
  }

  async deletePlay(playId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.PLAYS)
        .delete()
        .eq('id', playId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting play:', error);
      throw error;
    }
  }

  async deleteRotation(rotationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.ROTATIONS)
        .delete()
        .eq('id', rotationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting rotation:', error);
      throw error;
    }
  }
}
