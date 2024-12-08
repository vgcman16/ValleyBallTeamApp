import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Animated,
} from 'react-native';
import {
  Button,
  Icon,
  Overlay,
  Input,
  ListItem,
  Card,
  ButtonGroup,
} from 'react-native-elements';
import Svg, {
  Line,
  Circle,
  Path,
  Rect,
  G,
  Text as SvgText,
} from 'react-native-svg';
import { Picker } from '@react-native-picker/picker';
import {
  TacticsService,
  Formation,
  Play,
  Position,
  Movement,
} from '../../services/tacticsService';
import { useAuth } from '../../hooks/useAuth';
import { Text } from '../../components/Typography';

const { width: screenWidth } = Dimensions.get('window');
const COURT_ASPECT_RATIO = 18 / 9; // Standard volleyball court ratio
const COURT_WIDTH = screenWidth - 40;
const COURT_HEIGHT = COURT_WIDTH / COURT_ASPECT_RATIO;

type EditorMode = 'formation' | 'play';
type DrawingMode = 'position' | 'movement' | 'select';

export default function TeamTacticsScreen() {
  const { user } = useAuth();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [plays, setPlays] = useState<Play[]>([]);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [selectedPlay, setSelectedPlay] = useState<Play | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('formation');
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('position');
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [showPlayModal, setShowPlayModal] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const tacticsService = TacticsService.getInstance();
  const positionRefs = useRef<{ [key: string]: Animated.ValueXY }>({});

  // Form states
  const [formationForm, setFormationForm] = useState({
    name: '',
    description: '',
    type: 'serve' as Formation['type'],
    tags: [] as string[],
  });

  const [playForm, setPlayForm] = useState({
    name: '',
    description: '',
    tags: [] as string[],
  });

  useEffect(() => {
    loadFormations();
    loadPlays();
  }, []);

  const loadFormations = async () => {
    try {
      const fetchedFormations = await tacticsService.getFormations();
      setFormations(fetchedFormations);
    } catch (error) {
      console.error('Error loading formations:', error);
      Alert.alert('Error', 'Failed to load formations');
    }
  };

  const loadPlays = async () => {
    try {
      const fetchedPlays = await tacticsService.getPlays();
      setPlays(fetchedPlays);
    } catch (error) {
      console.error('Error loading plays:', error);
      Alert.alert('Error', 'Failed to load plays');
    }
  };

  const handleCreateFormation = async () => {
    try {
      const formation = await tacticsService.createFormation({
        ...formationForm,
        positions,
        createdBy: user.id,
      });
      setFormations([...formations, formation]);
      setShowFormationModal(false);
      resetFormationForm();
    } catch (error) {
      console.error('Error creating formation:', error);
      Alert.alert('Error', 'Failed to create formation');
    }
  };

  const handleCreatePlay = async () => {
    try {
      const play = await tacticsService.createPlay({
        ...playForm,
        formations: [selectedFormation!],
        movements,
        createdBy: user.id,
      });
      setPlays([...plays, play]);
      setShowPlayModal(false);
      resetPlayForm();
    } catch (error) {
      console.error('Error creating play:', error);
      Alert.alert('Error', 'Failed to create play');
    }
  };

  const resetFormationForm = () => {
    setFormationForm({
      name: '',
      description: '',
      type: 'serve',
      tags: [],
    });
    setPositions([]);
  };

  const resetPlayForm = () => {
    setPlayForm({
      name: '',
      description: '',
      tags: [],
    });
    setMovements([]);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt, gestureState) => {
      const { locationX, locationY } = evt.nativeEvent;
      
      if (drawingMode === 'position') {
        const newPosition: Position = {
          x: locationX / COURT_WIDTH,
          y: locationY / COURT_HEIGHT,
          rotation: 0,
        };
        setPositions([...positions, newPosition]);
      } else if (drawingMode === 'movement') {
        // Start drawing movement
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      if (drawingMode === 'select' && selectedItem) {
        const position = positions[selectedItem];
        positionRefs.current[selectedItem].setValue({
          x: gestureState.dx,
          y: gestureState.dy,
        });
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (drawingMode === 'select' && selectedItem) {
        const position = positions[selectedItem];
        const newX = position.x + gestureState.dx / COURT_WIDTH;
        const newY = position.y + gestureState.dy / COURT_HEIGHT;
        
        const updatedPositions = [...positions];
        updatedPositions[selectedItem] = {
          ...position,
          x: Math.max(0, Math.min(1, newX)),
          y: Math.max(0, Math.min(1, newY)),
        };
        setPositions(updatedPositions);
        
        positionRefs.current[selectedItem].setValue({ x: 0, y: 0 });
      }
    },
  });

  const renderCourt = () => (
    <Svg
      width={COURT_WIDTH}
      height={COURT_HEIGHT}
      viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
    >
      {/* Court outline */}
      <Rect
        x={0}
        y={0}
        width={COURT_WIDTH}
        height={COURT_HEIGHT}
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />

      {/* Center line */}
      <Line
        x1={COURT_WIDTH / 2}
        y1={0}
        x2={COURT_WIDTH / 2}
        y2={COURT_HEIGHT}
        stroke="#000"
        strokeWidth="2"
      />

      {/* Attack lines */}
      <Line
        x1={COURT_WIDTH * 0.33}
        y1={0}
        x2={COURT_WIDTH * 0.33}
        y2={COURT_HEIGHT}
        stroke="#000"
        strokeDasharray="5,5"
        strokeWidth="1"
      />
      <Line
        x1={COURT_WIDTH * 0.67}
        y1={0}
        x2={COURT_WIDTH * 0.67}
        y2={COURT_HEIGHT}
        stroke="#000"
        strokeDasharray="5,5"
        strokeWidth="1"
      />

      {/* Positions */}
      {positions.map((position, index) => (
        <Animated.View
          key={index}
          style={{
            transform: positionRefs.current[index]?.getTranslateTransform(),
          }}
        >
          <G>
            <Circle
              cx={position.x * COURT_WIDTH}
              cy={position.y * COURT_HEIGHT}
              r={15}
              fill={selectedItem === index ? '#2196F3' : '#000'}
              onPress={() => setSelectedItem(index)}
            />
            <SvgText
              x={position.x * COURT_WIDTH}
              y={position.y * COURT_HEIGHT}
              fill="#fff"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {index + 1}
            </SvgText>
          </G>
        </Animated.View>
      ))}

      {/* Movements */}
      {movements.map((movement, index) => (
        <G key={index}>
          <Path
            d={`M ${movement.startPosition.x * COURT_WIDTH} ${movement.startPosition.y * COURT_HEIGHT} L ${movement.endPosition.x * COURT_WIDTH} ${movement.endPosition.y * COURT_HEIGHT}`}
            stroke="#F44336"
            strokeWidth="2"
            fill="none"
          />
          <Circle
            cx={movement.endPosition.x * COURT_WIDTH}
            cy={movement.endPosition.y * COURT_HEIGHT}
            r={5}
            fill="#F44336"
          />
        </G>
      ))}
    </Svg>
  );

  const renderToolbar = () => (
    <View style={styles.toolbar}>
      <ButtonGroup
        onPress={(index) => {
          const modes: DrawingMode[] = ['position', 'movement', 'select'];
          setDrawingMode(modes[index]);
        }}
        selectedIndex={['position', 'movement', 'select'].indexOf(drawingMode)}
        buttons={[
          <Icon name="plus" type="font-awesome" size={20} />,
          <Icon name="arrow-right" type="font-awesome" size={20} />,
          <Icon name="hand-o-up" type="font-awesome" size={20} />,
        ]}
        containerStyle={styles.buttonGroup}
      />

      <Button
        title="Clear"
        onPress={() => {
          setPositions([]);
          setMovements([]);
        }}
        type="clear"
      />
    </View>
  );

  const renderFormationModal = () => (
    <Overlay
      isVisible={showFormationModal}
      onBackdropPress={() => setShowFormationModal(false)}
      overlayStyle={styles.modal}
    >
      <ScrollView>
        <Text h4 style={styles.modalTitle}>Create Formation</Text>

        <Input
          label="Name"
          value={formationForm.name}
          onChangeText={(text) => setFormationForm({ ...formationForm, name: text })}
        />

        <Input
          label="Description"
          value={formationForm.description}
          onChangeText={(text) => setFormationForm({ ...formationForm, description: text })}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Formation Type</Text>
        <Picker
          selectedValue={formationForm.type}
          onValueChange={(value) => setFormationForm({ ...formationForm, type: value })}
          style={styles.picker}
        >
          <Picker.Item label="Serve" value="serve" />
          <Picker.Item label="Receive" value="receive" />
          <Picker.Item label="Defense" value="defense" />
          <Picker.Item label="Attack" value="attack" />
        </Picker>

        <Button
          title="Create Formation"
          onPress={handleCreateFormation}
          disabled={!formationForm.name || positions.length === 0}
          containerStyle={styles.button}
        />
      </ScrollView>
    </Overlay>
  );

  const renderPlayModal = () => (
    <Overlay
      isVisible={showPlayModal}
      onBackdropPress={() => setShowPlayModal(false)}
      overlayStyle={styles.modal}
    >
      <ScrollView>
        <Text h4 style={styles.modalTitle}>Create Play</Text>

        <Input
          label="Name"
          value={playForm.name}
          onChangeText={(text) => setPlayForm({ ...playForm, name: text })}
        />

        <Input
          label="Description"
          value={playForm.description}
          onChangeText={(text) => setPlayForm({ ...playForm, description: text })}
          multiline
          numberOfLines={3}
        />

        <Button
          title="Create Play"
          onPress={handleCreatePlay}
          disabled={!playForm.name || !selectedFormation || movements.length === 0}
          containerStyle={styles.button}
        />
      </ScrollView>
    </Overlay>
  );

  return (
    <View style={styles.container}>
      <ButtonGroup
        onPress={(index) => {
          const modes: EditorMode[] = ['formation', 'play'];
          setEditorMode(modes[index]);
        }}
        selectedIndex={['formation', 'play'].indexOf(editorMode)}
        buttons={['Formations', 'Plays']}
        containerStyle={styles.buttonGroup}
      />

      <View style={styles.courtContainer} {...panResponder.panHandlers}>
        {renderCourt()}
      </View>

      {renderToolbar()}

      <ScrollView style={styles.itemsList}>
        <View style={styles.itemsHeader}>
          <Text style={styles.sectionTitle}>
            {editorMode === 'formation' ? 'Formations' : 'Plays'}
          </Text>
          <Button
            title={editorMode === 'formation' ? 'New Formation' : 'New Play'}
            onPress={() => {
              if (editorMode === 'formation') {
                setShowFormationModal(true);
              } else {
                setShowPlayModal(true);
              }
            }}
            type="clear"
          />
        </View>

        {editorMode === 'formation'
          ? formations.map((formation) => (
              <TouchableOpacity
                key={formation.id}
                onPress={() => {
                  setSelectedFormation(formation);
                  setPositions(formation.positions);
                }}
              >
                <Card>
                  <Text style={styles.itemTitle}>{formation.name}</Text>
                  <Text style={styles.itemType}>{formation.type}</Text>
                </Card>
              </TouchableOpacity>
            ))
          : plays.map((play) => (
              <TouchableOpacity
                key={play.id}
                onPress={() => {
                  setSelectedPlay(play);
                  setSelectedFormation(play.formations[0]);
                  setPositions(play.formations[0].positions);
                  setMovements(play.movements);
                }}
              >
                <Card>
                  <Text style={styles.itemTitle}>{play.name}</Text>
                  <Text style={styles.itemDescription}>{play.description}</Text>
                </Card>
              </TouchableOpacity>
            ))}
      </ScrollView>

      {renderFormationModal()}
      {renderPlayModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  buttonGroup: {
    marginVertical: 10,
  },
  courtContainer: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e1e8ee',
  },
  itemsList: {
    flex: 1,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemType: {
    fontSize: 14,
    color: '#666',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
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
    marginTop: 20,
  },
});
