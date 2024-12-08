import { supabase } from './supabase';
import { TABLES } from '../constants/supabase';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { FFmpegKit, FFprobeKit } from 'ffmpeg-kit-react-native';

export interface VideoAnnotation {
  id: string;
  videoId: string;
  timestamp: number;
  duration: number;
  type: 'technique' | 'play' | 'highlight' | 'comment';
  title: string;
  description: string;
  drawingData?: string; // JSON string of drawing coordinates
  tags?: string[];
}

export interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  date: string;
  duration: number;
  thumbnailUrl?: string;
  url: string;
  type: 'game' | 'practice' | 'drill' | 'analysis';
  tags?: string[];
  playerId?: string;
  matchId?: string;
}

export class VideoAnalysisService {
  private static instance: VideoAnalysisService;

  private constructor() {}

  static getInstance(): VideoAnalysisService {
    if (!VideoAnalysisService.instance) {
      VideoAnalysisService.instance = new VideoAnalysisService();
    }
    return VideoAnalysisService.instance;
  }

  async uploadVideo(
    uri: string,
    metadata: Omit<VideoMetadata, 'id' | 'duration' | 'thumbnailUrl' | 'url'>
  ): Promise<VideoMetadata> {
    try {
      // Get video duration using FFprobe
      const duration = await this.getVideoDuration(uri);

      // Generate thumbnail
      const thumbnailPath = await this.generateThumbnail(uri);

      // Upload video to Supabase Storage
      const videoFileName = \`videos/\${new Date().getTime()}_\${metadata.title.replace(/\\s+/g, '_')}.mp4\`;
      const { data: videoData, error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, {
          uri,
          type: 'video/mp4',
          name: videoFileName,
        });

      if (videoError) throw videoError;

      // Upload thumbnail to Supabase Storage
      const thumbnailFileName = videoFileName.replace('.mp4', '_thumb.jpg');
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('videos')
        .upload(thumbnailFileName, {
          uri: thumbnailPath,
          type: 'image/jpeg',
          name: thumbnailFileName,
        });

      if (thumbError) throw thumbError;

      // Get public URLs
      const videoUrl = supabase.storage.from('videos').getPublicUrl(videoFileName).data.publicUrl;
      const thumbnailUrl = supabase.storage.from('videos').getPublicUrl(thumbnailFileName).data.publicUrl;

      // Save metadata to database
      const { data, error } = await supabase
        .from(TABLES.VIDEOS)
        .insert([{
          title: metadata.title,
          description: metadata.description,
          date: metadata.date,
          duration,
          thumbnail_url: thumbnailUrl,
          url: videoUrl,
          type: metadata.type,
          tags: metadata.tags,
          player_id: metadata.playerId,
          match_id: metadata.matchId,
        }])
        .select()
        .single();

      if (error) throw error;

      // Clean up temporary thumbnail file
      await RNFS.unlink(thumbnailPath);

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        date: data.date,
        duration: data.duration,
        thumbnailUrl: data.thumbnail_url,
        url: data.url,
        type: data.type,
        tags: data.tags,
        playerId: data.player_id,
        matchId: data.match_id,
      };
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  private async getVideoDuration(uri: string): Promise<number> {
    try {
      const result = await FFprobeKit.execute(\`-v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "\${uri}"\`);
      const output = await result.getOutput();
      return parseFloat(output.trim());
    } catch (error) {
      console.error('Error getting video duration:', error);
      throw error;
    }
  }

  private async generateThumbnail(uri: string): Promise<string> {
    try {
      const thumbnailPath = \`\${RNFS.CachesDirectoryPath}/thumbnail_\${new Date().getTime()}.jpg\`;
      await FFmpegKit.execute(\`-i "\${uri}" -ss 00:00:01 -frames:v 1 "\${thumbnailPath}"\`);
      return thumbnailPath;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  }

  async getVideos(filters?: {
    type?: VideoMetadata['type'];
    playerId?: string;
    matchId?: string;
    tags?: string[];
  }): Promise<VideoMetadata[]> {
    try {
      let query = supabase
        .from(TABLES.VIDEOS)
        .select('*')
        .order('date', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.playerId) {
        query = query.eq('player_id', filters.playerId);
      }
      if (filters?.matchId) {
        query = query.eq('match_id', filters.matchId);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        date: video.date,
        duration: video.duration,
        thumbnailUrl: video.thumbnail_url,
        url: video.url,
        type: video.type,
        tags: video.tags,
        playerId: video.player_id,
        matchId: video.match_id,
      }));
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }
  }

  async addAnnotation(annotation: Omit<VideoAnnotation, 'id'>): Promise<VideoAnnotation> {
    try {
      const { data, error } = await supabase
        .from(TABLES.VIDEO_ANNOTATIONS)
        .insert([{
          video_id: annotation.videoId,
          timestamp: annotation.timestamp,
          duration: annotation.duration,
          type: annotation.type,
          title: annotation.title,
          description: annotation.description,
          drawing_data: annotation.drawingData,
          tags: annotation.tags,
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        videoId: data.video_id,
        timestamp: data.timestamp,
        duration: data.duration,
        type: data.type,
        title: data.title,
        description: data.description,
        drawingData: data.drawing_data,
        tags: data.tags,
      };
    } catch (error) {
      console.error('Error adding annotation:', error);
      throw error;
    }
  }

  async getAnnotations(videoId: string): Promise<VideoAnnotation[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.VIDEO_ANNOTATIONS)
        .select('*')
        .eq('video_id', videoId)
        .order('timestamp');

      if (error) throw error;

      return data.map(annotation => ({
        id: annotation.id,
        videoId: annotation.video_id,
        timestamp: annotation.timestamp,
        duration: annotation.duration,
        type: annotation.type,
        title: annotation.title,
        description: annotation.description,
        drawingData: annotation.drawing_data,
        tags: annotation.tags,
      }));
    } catch (error) {
      console.error('Error fetching annotations:', error);
      throw error;
    }
  }

  async deleteVideo(videoId: string): Promise<void> {
    try {
      const { data: video, error: fetchError } = await supabase
        .from(TABLES.VIDEOS)
        .select('url, thumbnail_url')
        .eq('id', videoId)
        .single();

      if (fetchError) throw fetchError;

      // Delete video and thumbnail from storage
      const videoKey = video.url.split('/').pop();
      const thumbnailKey = video.thumbnail_url.split('/').pop();

      await Promise.all([
        supabase.storage.from('videos').remove([videoKey]),
        supabase.storage.from('videos').remove([thumbnailKey]),
      ]);

      // Delete video metadata and annotations from database
      const { error: deleteError } = await supabase
        .from(TABLES.VIDEOS)
        .delete()
        .eq('id', videoId);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  async updateAnnotation(
    annotationId: string,
    updates: Partial<Omit<VideoAnnotation, 'id' | 'videoId'>>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.VIDEO_ANNOTATIONS)
        .update(updates)
        .eq('id', annotationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating annotation:', error);
      throw error;
    }
  }

  async deleteAnnotation(annotationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.VIDEO_ANNOTATIONS)
        .delete()
        .eq('id', annotationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting annotation:', error);
      throw error;
    }
  }

  async generateVideoClip(
    videoUrl: string,
    startTime: number,
    duration: number
  ): Promise<string> {
    try {
      const outputPath = \`\${RNFS.CachesDirectoryPath}/clip_\${new Date().getTime()}.mp4\`;
      await FFmpegKit.execute(
        \`-i "\${videoUrl}" -ss \${startTime} -t \${duration} -c copy "\${outputPath}"\`
      );
      return outputPath;
    } catch (error) {
      console.error('Error generating video clip:', error);
      throw error;
    }
  }
}
