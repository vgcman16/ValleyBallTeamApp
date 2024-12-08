import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  PanResponder,
} from 'react-native';
import {
  Button,
  Icon,
  Overlay,
  Input,
  ListItem,
  Card,
} from 'react-native-elements';
import Video from 'react-native-video';
import { Picker } from '@react-native-picker/picker';
import DocumentPicker from 'react-native-document-picker';
import Slider from '@react-native-community/slider';
import { Canvas } from 'react-native-canvas';
import {
  VideoAnalysisService,
  VideoMetadata,
  VideoAnnotation,
} from '../../services/videoAnalysisService';
import { useAuth } from '../../hooks/useAuth';
import { Text } from '../../components/Typography';

const { width: screenWidth } = Dimensions.get('window');

export default function VideoAnalysisScreen() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(true);

  const videoRef = useRef<any>(null);
  const canvasRef = useRef<Canvas>(null);
  const drawingPathRef = useRef<any[]>([]);

  const videoService = VideoAnalysisService.getInstance();

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    type: 'game' as VideoMetadata['type'],
    tags: [] as string[],
    selectedFile: null as any,
  });

  // Annotation form state
  const [annotationForm, setAnnotationForm] = useState({
    title: '',
    description: '',
    type: 'technique' as VideoAnnotation['type'],
    tags: [] as string[],
  });

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    if (selectedVideo) {
      loadAnnotations(selectedVideo.id);
    }
  }, [selectedVideo]);

  const loadVideos = async () => {
    try {
      const fetchedVideos = await videoService.getVideos();
      setVideos(fetchedVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const loadAnnotations = async (videoId: string) => {
    try {
      const fetchedAnnotations = await videoService.getAnnotations(videoId);
      setAnnotations(fetchedAnnotations);
    } catch (error) {
      console.error('Error loading annotations:', error);
      Alert.alert('Error', 'Failed to load annotations');
    }
  };

  const handleUploadVideo = async () => {
    try {
      if (!uploadForm.selectedFile) {
        Alert.alert('Error', 'Please select a video file');
        return;
      }

      setLoading(true);
      const metadata: any = {
        title: uploadForm.title,
        description: uploadForm.description,
        date: new Date().toISOString(),
        type: uploadForm.type,
        tags: uploadForm.tags,
      };

      await videoService.uploadVideo(uploadForm.selectedFile.uri, metadata);
      setShowUploadModal(false);
      loadVideos();
      Alert.alert('Success', 'Video uploaded successfully');
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('Error', 'Failed to upload video');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnotation = async () => {
    if (!selectedVideo) return;

    try {
      const drawingData = canvasRef.current
        ? JSON.stringify(drawingPathRef.current)
        : undefined;

      const annotation: Omit<VideoAnnotation, 'id'> = {
        videoId: selectedVideo.id,
        timestamp: currentTime,
        duration: 5, // Default duration
        type: annotationForm.type,
        title: annotationForm.title,
        description: annotationForm.description,
        drawingData,
        tags: annotationForm.tags,
      };

      await videoService.addAnnotation(annotation);
      loadAnnotations(selectedVideo.id);
      setShowAnnotationModal(false);
      clearDrawing();
    } catch (error) {
      console.error('Error adding annotation:', error);
      Alert.alert('Error', 'Failed to add annotation');
    }
  };

  const handleSelectVideo = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.video],
      });
      setUploadForm({ ...uploadForm, selectedFile: result[0] });
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        console.error('Error selecting video:', error);
        Alert.alert('Error', 'Failed to select video');
      }
    }
  };

  const handleVideoProgress = (progress: { currentTime: number }) => {
    setCurrentTime(progress.currentTime);
    showAnnotationAtTime(progress.currentTime);
  };

  const showAnnotationAtTime = (time: number) => {
    const currentAnnotation = annotations.find(
      annotation =>
        time >= annotation.timestamp &&
        time <= annotation.timestamp + annotation.duration
    );

    if (currentAnnotation?.drawingData) {
      drawAnnotation(JSON.parse(currentAnnotation.drawingData));
    } else {
      clearDrawing();
    }
  };

  const drawAnnotation = (pathData: any[]) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 3;

    pathData.forEach(path => {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      path.forEach((point: { x: number; y: number }) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
  };

  const clearDrawing = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    drawingPathRef.current = [];
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      if (!isDrawing) return;

      const { locationX, locationY } = evt.nativeEvent;
      drawingPathRef.current.push([{ x: locationX, y: locationY }]);
    },
    onPanResponderMove: (evt) => {
      if (!isDrawing) return;

      const { locationX, locationY } = evt.nativeEvent;
      const currentPath = drawingPathRef.current[drawingPathRef.current.length - 1];
      currentPath.push({ x: locationX, y: locationY });
      drawAnnotation(drawingPathRef.current);
    },
  });

  const renderUploadModal = () => (
    <Overlay
      isVisible={showUploadModal}
      onBackdropPress={() => setShowUploadModal(false)}
      overlayStyle={styles.modal}
    >
      <ScrollView>
        <Text h4 style={styles.modalTitle}>Upload Video</Text>

        <Input
          label="Title"
          value={uploadForm.title}
          onChangeText={(text) => setUploadForm({ ...uploadForm, title: text })}
        />

        <Input
          label="Description"
          value={uploadForm.description}
          onChangeText={(text) => setUploadForm({ ...uploadForm, description: text })}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Video Type</Text>
        <Picker
          selectedValue={uploadForm.type}
          onValueChange={(value) => setUploadForm({ ...uploadForm, type: value })}
          style={styles.picker}
        >
          <Picker.Item label="Game" value="game" />
          <Picker.Item label="Practice" value="practice" />
          <Picker.Item label="Drill" value="drill" />
          <Picker.Item label="Analysis" value="analysis" />
        </Picker>

        <Button
          title="Select Video"
          onPress={handleSelectVideo}
          type="outline"
          containerStyle={styles.button}
        />

        {uploadForm.selectedFile && (
          <Text style={styles.selectedFile}>
            Selected: {uploadForm.selectedFile.name}
          </Text>
        )}

        <Button
          title="Upload"
          onPress={handleUploadVideo}
          loading={loading}
          disabled={loading || !uploadForm.selectedFile || !uploadForm.title}
          containerStyle={styles.button}
        />
      </ScrollView>
    </Overlay>
  );

  const renderAnnotationModal = () => (
    <Overlay
      isVisible={showAnnotationModal}
      onBackdropPress={() => setShowAnnotationModal(false)}
      overlayStyle={styles.modal}
    >
      <ScrollView>
        <Text h4 style={styles.modalTitle}>Add Annotation</Text>

        <Input
          label="Title"
          value={annotationForm.title}
          onChangeText={(text) => setAnnotationForm({ ...annotationForm, title: text })}
        />

        <Input
          label="Description"
          value={annotationForm.description}
          onChangeText={(text) => setAnnotationForm({ ...annotationForm, description: text })}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Annotation Type</Text>
        <Picker
          selectedValue={annotationForm.type}
          onValueChange={(value) => setAnnotationForm({ ...annotationForm, type: value })}
          style={styles.picker}
        >
          <Picker.Item label="Technique" value="technique" />
          <Picker.Item label="Play" value="play" />
          <Picker.Item label="Highlight" value="highlight" />
          <Picker.Item label="Comment" value="comment" />
        </Picker>

        <Button
          title={isDrawing ? "Finish Drawing" : "Start Drawing"}
          onPress={() => setIsDrawing(!isDrawing)}
          type="outline"
          containerStyle={styles.button}
        />

        <Button
          title="Add Annotation"
          onPress={handleAddAnnotation}
          disabled={!annotationForm.title}
          containerStyle={styles.button}
        />
      </ScrollView>
    </Overlay>
  );

  return (
    <View style={styles.container}>
      {selectedVideo ? (
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: selectedVideo.url }}
            style={styles.video}
            resizeMode="contain"
            onProgress={handleVideoProgress}
            paused={!isPlaying}
            repeat
          />

          <Canvas
            ref={canvasRef}
            style={styles.canvas}
            {...panResponder.panHandlers}
          />

          <View style={styles.videoControls}>
            <Button
              icon={
                <Icon
                  name={isPlaying ? 'pause' : 'play'}
                  type="font-awesome"
                  color="#ffffff"
                  size={20}
                />
              }
              onPress={() => setIsPlaying(!isPlaying)}
              type="clear"
            />

            <Slider
              style={styles.slider}
              value={currentTime}
              maximumValue={selectedVideo.duration}
              minimumValue={0}
              onValueChange={(value) => {
                videoRef.current.seek(value);
                setCurrentTime(value);
              }}
            />

            <Text style={styles.timestamp}>
              {Math.floor(currentTime / 60)}:
              {Math.floor(currentTime % 60).toString().padStart(2, '0')} /
              {Math.floor(selectedVideo.duration / 60)}:
              {Math.floor(selectedVideo.duration % 60).toString().padStart(2, '0')}
            </Text>
          </View>

          <Button
            title="Add Annotation"
            onPress={() => setShowAnnotationModal(true)}
            containerStyle={styles.annotateButton}
          />

          <ScrollView style={styles.annotationsList}>
            <Text style={styles.sectionTitle}>Annotations</Text>
            {annotations.map((annotation) => (
              <TouchableOpacity
                key={annotation.id}
                onPress={() => {
                  videoRef.current.seek(annotation.timestamp);
                  setCurrentTime(annotation.timestamp);
                }}
              >
                <Card>
                  <View style={styles.annotationCard}>
                    <Text style={styles.annotationTitle}>{annotation.title}</Text>
                    <Text style={styles.annotationType}>
                      {annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1)}
                    </Text>
                    <Text style={styles.annotationTimestamp}>
                      {Math.floor(annotation.timestamp / 60)}:
                      {Math.floor(annotation.timestamp % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <ScrollView style={styles.videoList}>
          <Button
            title="Upload Video"
            onPress={() => setShowUploadModal(true)}
            containerStyle={styles.uploadButton}
          />

          {videos.map((video) => (
            <TouchableOpacity
              key={video.id}
              onPress={() => setSelectedVideo(video)}
            >
              <Card>
                <Card.Image
                  source={{ uri: video.thumbnailUrl }}
                  style={styles.thumbnail}
                />
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle}>{video.title}</Text>
                  <Text style={styles.videoType}>
                    {video.type.charAt(0).toUpperCase() + video.type.slice(1)}
                  </Text>
                  <Text style={styles.videoDate}>
                    {new Date(video.date).toLocaleDateString()}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {renderUploadModal()}
      {renderAnnotationModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    width: screenWidth,
    height: screenWidth * (9/16),
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenWidth * (9/16),
  },
  videoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#000000',
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timestamp: {
    color: '#ffffff',
    marginLeft: 10,
  },
  annotateButton: {
    margin: 10,
  },
  annotationsList: {
    flex: 1,
    padding: 10,
  },
  videoList: {
    flex: 1,
  },
  uploadButton: {
    margin: 10,
  },
  thumbnail: {
    height: 200,
  },
  videoInfo: {
    padding: 10,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  videoType: {
    fontSize: 14,
    color: '#666',
  },
  videoDate: {
    fontSize: 14,
    color: '#666',
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#86939e',
    marginBottom: 5,
  },
  picker: {
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  selectedFile: {
    marginTop: 10,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  annotationCard: {
    padding: 10,
  },
  annotationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  annotationType: {
    fontSize: 14,
    color: '#666',
  },
  annotationTimestamp: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});
