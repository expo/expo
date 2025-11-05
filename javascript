import { StyleSheet, Text, View, TextInput, Button, Image, Alert, ImageBackground, Platform } from 'react-native';
import { useState } from 'react';

export default function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Show alert (with web fallback)
  const handleSubmit = () => {
    if (!name || !email) {
      if (Platform.OS === 'web') {
        alert('Please enter both name and email!');
      } else {
        Alert.alert('Error', 'Please enter both name and email!');
      }
      return;
    }

    const message = `Name: ${name}\nEmail: ${email}`;
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Input Details', message);
    }
  };

  const handleClear = () => {
    setName('');
    setEmail('');
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1000&q=80' }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Image section */}
        <Image
          source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT232haG409MiaSseVZ1K5qgX-G5Kp7fWBoJQ&s' }}
          style={styles.image}
        />

        <Text style={styles.paragraph}>baao community college</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter your Email"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            <Button title="Clear" color="red" onPress={handleClear} />
          </View>
          <View style={styles.button}>
            <Button title="Submit" color="#2ecc71" onPress={handleSubmit} />
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,0,0.6)', // semi-transparent yellow overlay
    padding: 8,
  },
  paragraph: {
    margin: 24,
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    width: '40%',
  },
  image: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 20,
  },
});
