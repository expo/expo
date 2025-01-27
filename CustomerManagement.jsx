import React, { useState, useRef } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { cpf as cpfValidator } from "cpf-cnpj-validator";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import { useNavigation } from "@react-navigation/native";

const CustomerManagement = () => {
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    purchaseDate: "",
    delivery: false,
    returnDate: "",
    password: "",
    observation: "",
    signature: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const signatureRef = useRef(null);
  const navigation = useNavigation();

  const handleChange = (name, value) => {
    setNewCustomer({ ...newCustomer, [name]: value });
  };

  const handleClearSignature = () => {
    signatureRef.current.clear();
    setNewCustomer({ ...newCustomer, signature: "" });
  };

  const addCustomer = async () => {
    if (!cpfValidator.isValid(newCustomer.cpf)) {
      setErrorMessage("CPF inválido.");
      return;
    }

    const signatureImage = signatureRef.current.isEmpty()
      ? ""
      : signatureRef.current.toDataURL();
    const customerData = { ...newCustomer, signature: signatureImage };

    try {
      const response = await axios.post("http://localhost:5000/customers", customerData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.status === 201) {
        Alert.alert("Cliente adicionado com sucesso!");
        setNewCustomer({
          name: "",
          email: "",
          phone: "",
          cpf: "",
          purchaseDate: "",
          delivery: false,
          returnDate: "",
          password: "",
          observation: "",
          signature: "",
        });
        setErrorMessage("");
        handleClearSignature();
      }
    } catch (error) {
      setErrorMessage("Erro ao adicionar cliente: " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Gerenciamento de Clientes</Text>
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={newCustomer.name}
        onChangeText={(value) => handleChange("name", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={newCustomer.email}
        onChangeText={(value) => handleChange("email", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Telefone"
        value={newCustomer.phone}
        onChangeText={(value) => handleChange("phone", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="CPF"
        value={newCustomer.cpf}
        onChangeText={(value) => handleChange("cpf", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Data da Compra"
        value={newCustomer.purchaseDate}
        onChangeText={(value) => handleChange("purchaseDate", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Data de Devolução"
        value={newCustomer.returnDate}
        onChangeText={(value) => handleChange("returnDate", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={newCustomer.password}
        onChangeText={(value) => handleChange("password", value)}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Observação"
        value={newCustomer.observation}
        onChangeText={(value) => handleChange("observation", value)}
      />
      <SignatureCanvas
        ref={signatureRef}
        penColor="black"
        canvasProps={{ width: 300, height: 100, className: "signatureCanvas" }}
      />
      <Button title="Limpar Assinatura" onPress={handleClearSignature} />
      <Button title="Adicionar Cliente" onPress={addCustomer} />
      <Button title="Ver Lista de Clientes" onPress={() => navigation.navigate("CustomerList")} />
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

export default CustomerManagement;