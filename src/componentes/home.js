import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Image, TextInput,
  TouchableOpacity, Modal, ActivityIndicator,
} from 'react-native';

export const getCardImage = (nameShort) =>
  `https://www.sacred-texts.com/tarot/pkt/img/${nameShort.replace(/ac$/, '01')}.jpg`;

export default function Home() {
  const [data, setData] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionada, setSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const res = await fetch('https://tarotapi.dev/api/v1/cards');
        const json = await res.json();
        setData(json.cards);
      } catch (e) {
        console.error('Error al obtener las cartas:', e);
      } finally {
        setLoading(false);
      }
    };
    obtenerDatos();
  }, []);

  const filtradas = data.filter((c) =>
    c.name.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={styles.buscador}
        placeholder="Buscar carta..."
        value={busqueda}
        onChangeText={setBusqueda}
      />

      <ScrollView>
        <View style={styles.lista}>
          {filtradas.map((carta) => (
            <TouchableOpacity
              key={carta.name_short}
              style={styles.item}
              onPress={() => setSeleccionada(carta)}
            >
              <Image
                source={{ uri: getCardImage(carta.name_short) }}
                style={styles.imagen}
              />
              <Text style={styles.nombre}>{carta.name}</Text>
              <Text style={styles.tipo}>
                {carta.type === 'major' ? 'Arcano mayor' : `Arcano menor · ${carta.suit}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Detalle de la carta */}
      <Modal visible={!!seleccionada} animationType="slide" onRequestClose={() => setSeleccionada(null)}>
        {seleccionada && (
          <ScrollView contentContainerStyle={styles.modal}>
            <Text style={styles.titulo}>{seleccionada.name}</Text>
            <Image
              source={{ uri: getCardImage(seleccionada.name_short) }}
              style={styles.imagenGrande}
            />
            <Text style={styles.seccion}>🔼 Significado (derecha)</Text>
            <Text style={styles.texto}>{seleccionada.meaning_up}</Text>

            <Text style={styles.seccion}>🔽 Significado (invertida)</Text>
            <Text style={styles.texto}>{seleccionada.meaning_rev}</Text>

            <Text style={styles.seccion}>📜 Descripción</Text>
            <Text style={styles.texto}>{seleccionada.desc}</Text>

            <TouchableOpacity style={styles.boton} onPress={() => setSeleccionada(null)}>
              <Text style={styles.botonTexto}>Cerrar</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  lista: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'space-between',
    padding: 10,
  },
  item: {
    backgroundColor: 'aliceblue',
    width: '48%',
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 8,
  },
  imagen: { width: 100, height: 170, resizeMode: 'contain' },
  nombre: { fontWeight: 'bold', textAlign: 'center', marginTop: 6 },
  tipo: { fontSize: 12, color: '#666', textTransform: 'capitalize' },
  buscador: {
    margin: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
  },
  modal: { padding: 20, alignItems: 'center' },
  titulo: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
  imagenGrande: { width: 220, height: 380, resizeMode: 'contain', marginBottom: 15 },
  seccion: { fontSize: 18, fontWeight: 'bold', alignSelf: 'flex-start', marginTop: 12 },
  texto: { fontSize: 15, alignSelf: 'flex-start', marginTop: 4 },
  boton: { marginTop: 20, padding: 12, backgroundColor: '#4b2c82', borderRadius: 8 },
  botonTexto: { color: 'white', fontWeight: 'bold' },
});