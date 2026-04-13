import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CameraScreen({ onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const cameraRef = useRef(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photoData = await cameraRef.current.takePictureAsync({
        base64: true, 
        quality: 0.5,
      });
      setPhoto(photoData);
    }
  };

  const saveToDB = async () => {
    // We will connect this to your database later
    alert('Image captured! Ready to save.');
    setPhoto(null);
    if (onClose) onClose(); 
  };

  return (
    <View style={styles.container}>
      {!photo ? (
        <CameraView style={styles.camera} ref={cameraRef} facing="back">
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <Text style={styles.btnText}>Click Photo</Text>
            </TouchableOpacity>
            {/* Close button if needed */}
            {onClose && (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.btnText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </CameraView>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo.uri }} style={styles.preview} />
          <View style={styles.actionButtons}>
            <Button title="Retake" onPress={() => setPhoto(null)} />
            <Button title="Save" onPress={saveToDB} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  buttonContainer: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', marginBottom: 30
  },
  button: {
    alignSelf: 'flex-end', backgroundColor: 'white', padding: 15, borderRadius: 30, marginRight: 20
  },
  closeButton: {
    alignSelf: 'flex-end', backgroundColor: 'red', padding: 15, borderRadius: 30
  },
  btnText: { fontWeight: 'bold' },
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  preview: { width: '90%', height: '70%', borderRadius: 10, marginBottom: 20 },
  actionButtons: { flexDirection: 'row', gap: 20 },
  text: { color: 'white', textAlign: 'center', marginTop: 50 }
});