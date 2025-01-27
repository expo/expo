import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import axios from "axios";
import { useRoute, useNavigation } from "@react-navigation/native";
import SignatureCanvas from "react-signature-canvas";

const CustomerUpdate = () => {
  const route = useRoute();
  const { id } = route.params;
  const navigation = useNavigation();
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    purchaseDate: "",
    returnDate: "",
    observation: "",
    signature: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const signatureRef = useRef(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/customers/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setCustomer(response.data);
      } catch (error) {
        console.error("Erro ao buscar cliente:", error);
      }
    };

    fetchCustomer();
  }, [id]);

  const handleChange = (name, value) => {
    setCustomer({ ...customer, [name]: value });
  };

  const handleSubmit = async () => {
    const signatureImage = signatureRef.current.isEmpty()
      ? customer.signature
      : signatureRef.current.toDataURL();

    try {
      await axios.put(`http://localhost:5000/customers/${id}`, {
        ...customer,
        signature: signatureImage,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      Alert.alert("Cliente atualizado com sucesso!");
      navigation.navigate("CustomerList");
    } catch (error) {
      setErrorMessage("Erro ao atualizar cliente. Tente novamente.");
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Atualizar Cliente</Text>
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={customer.name}
        onChangeText={(value) => handleChange("name", value)}
        editable={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={customer.email}
        onChangeText={(value) => handleChange("email", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Telefone"
        value={customer.phone}
        onChangeText={(value) => handleChange("phone", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="CPF"
        value={customer.cpf}
        onChangeText={(value) => handleChange("cpf", value)}
        editable={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Data da Compra"
        value={customer.purchaseDate}
        onChangeText={(value) => handleChange("purchaseDate", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Data de Devolução"
        value={customer.returnDate}
        onChangeText={(value) => handleChange("returnDate", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Observação"
        value={customer.observation}
        onChangeText={(value) => handleChange("observation", value)}
      />
      <SignatureCanvas
        ref={signatureRef}
        penColor="black"
        canvasProps={{ width: 300, height: 100, className: "signatureCanvas" }}
      />
      <Button title="Limpar Assinatura" onPress={() => signatureRef.current.clear()} />
      <Button title="Atualizar Cliente" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  heading: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  error: {
    color: "red",
    marginBottom: 20,
  },
});

export default CustomerUpdate;