import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState({});
  const [showHistory, setShowHistory] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/customers", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setCustomers(response.data);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      }
    };

    fetchCustomers();
  }, []);

  const handleSearchChange = (text) => {
    setSearchTerm(text);
  };

  const toggleShowPassword = (id) => {
    setShowPassword((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const toggleShowHistory = (id) => {
    setShowHistory((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.cpf.includes(searchTerm)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Lista de Clientes</Text>
      <Button title="Voltar ao Gerenciamento de Clientes" onPress={() => navigation.navigate("CustomerManagement")} />
      <TextInput
        style={styles.input}
        placeholder="Pesquisar por nome ou CPF"
        value={searchTerm}
        onChangeText={handleSearchChange}
      />
      {filteredCustomers.length === 0 ? (
        <Text>Nenhum cliente encontrado.</Text>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item._id}
          renderItem={({ item: customer }) => (
            <View style={styles.customerItem}>
              <Text>Nome: {customer.name}</Text>
              <Text>Cpf: {customer.cpf}</Text>
              <Text>Data da Compra: {customer.purchaseDate}</Text>
              <Text>Devolução do cartão: {customer.returnDate}</Text>
              <Text>
                Senha do Cartão: {showPassword[customer._id] ? customer.password : "******"}
                <Button title={showPassword[customer._id] ? "Ocultar" : "Mostrar"} onPress={() => toggleShowPassword(customer._id)} />
              </Text>
              <Text>Obs: {customer.observation}</Text>
              {customer.signature ? (
                <View>
                  <Text>Assinatura:</Text>
                  <Image
                    source={{ uri: customer.signature }}
                    style={styles.signature}
                  />
                </View>
              ) : (
                <Text>Assinatura: Não disponível</Text>
              )}
              <Button title={showHistory[customer._id] ? "Ocultar Histórico" : "Mostrar Histórico"} onPress={() => toggleShowHistory(customer._id)} />
              {showHistory[customer._id] && (
                <View>
                  <Text>Histórico de Compras</Text>
                  <FlatList
                    data={customer.purchaseHistory}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item: history }) => (
                      <View>
                        <Text>Obs: {history.observation}</Text>
                        <Text>Data da Compra: {history.purchaseDate}</Text>
                        <Text>Data de Devolução: {history.returnDate}</Text>
                        {history.signature && (
                          <View>
                            <Text>Assinatura:</Text>
                            <Image
                              source={{ uri: history.signature }}
                              style={styles.signature}
                            />
                          </View>
                        )}
                      </View>
                    )}
                  />
                </View>
              )}
              <Button title="Atualizar" onPress={() => navigation.navigate("CustomerUpdate", { id: customer._id })} />
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  customerItem: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  signature: {
    borderWidth: 1,
    borderColor: "#000",
    width: 300,
    height: 100,
    marginTop: 10,
  },
});

export default CustomerList;