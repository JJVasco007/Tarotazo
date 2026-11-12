import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_ATTEMPTS = 7;
const esLetra = (l) => /[A-Z]/.test(l);

const getCardImage = (nameShort) =>
  `https://www.sacred-texts.com/tarot/pkt/img/${nameShort.replace(/ac$/, '01')}.jpg`;

export default function JuegoTarot() {
  const [cardName, setCardName] = useState('');
  const [cardImage, setCardImage] = useState('');
  const [cardHint, setCardHint] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userWin, setUserWin] = useState(0);
  const [userLose, setUserLose] = useState(0);
  const [uid, setUid] = useState(null);

  // Escuchar el login del usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
    });
    return unsubscribe;
  }, []);

  // Obtener datos del usuario
  useEffect(() => {
    if (!uid) return;
    const traerDatos = async () => {
      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserWin(data.ganados || 0);
        setUserLose(data.perdidos || 0);
      } else {
        await setDoc(docRef, { ganados: 0, perdidos: 0 });
        setUserWin(0);
        setUserLose(0);
      }
    };
    traerDatos();
  }, [uid]);

  // Traer una carta aleatoria
  const cargarCarta = async () => {
    setLoading(true);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameOver(false);
    setGameWon(false);
    try {
      const res = await fetch('https://tarotapi.dev/api/v1/cards/random?n=1');
      const json = await res.json();
      const carta = json.cards[0];
      setCardName(carta.name.toUpperCase());
      setCardImage(getCardImage(carta.name_short));
      setCardHint(carta.meaning_up);
    } catch (err) {
      console.error('Error al obtener la carta:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCarta();
  }, []);

  const guardarResultado = async (acierto) => {
    if (!uid) return;
    const fecha = new Date().toISOString();
    try {
      await setDoc(doc(db, 'resultados', `${uid}_${fecha}`), {
        uid,
        carta: cardName,
        aciertos: acierto ? 1 : 0,
        errores: acierto ? 0 : 1,
        fecha,
      });
      await updateDoc(doc(db, 'usuarios', uid), {
        ganados: increment(acierto ? 1 : 0),
        perdidos: increment(acierto ? 0 : 1),
      });
    } catch (e) {
      console.error('Error al guardar resultado:', e);
    }
  };

  const handleLetterClick = async (letter) => {
    if (guessedLetters.includes(letter) || gameOver || gameWon) return;

    const updatedGuessed = [...guessedLetters, letter];
    setGuessedLetters(updatedGuessed);

    if (!cardName.includes(letter)) {
      const newWrong = wrongGuesses + 1;
      setWrongGuesses(newWrong);
      if (newWrong >= MAX_ATTEMPTS) {
        setGameOver(true);
        setUserLose((n) => n + 1);
        await guardarResultado(false);
      }
    } else {
      const allCorrect = cardName
        .split('')
        .every((l) => !esLetra(l) || updatedGuessed.includes(l));
      if (allCorrect) {
        setGameWon(true);
        setUserWin((n) => n + 1);
        await guardarResultado(true);
      }
    }
  };

  const renderWord = () =>
    cardName.split('').map((letter, index) => {
      if (!esLetra(letter)) return <Text key={index} style={styles.space}> </Text>;
      const visible = guessedLetters.includes(letter) || gameOver || gameWon;
      return (
        <Text key={index} style={styles.letter}>
          {visible ? letter : '_'}
        </Text>
      );
    });

  const terminado = gameOver || gameWon;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔮 Adivina la carta del Tarot</Text>
      <Text style={styles.stats}>
        Ganados: {userWin} | Perdidos: {userLose}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          {terminado ? (
            <Image source={{ uri: cardImage }} style={styles.image} />
          ) : (
            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>Pista (significado):</Text>
              <Text style={styles.hintText}>{cardHint}</Text>
            </View>
          )}

          <View style={styles.wordContainer}>{renderWord()}</View>

          <View style={styles.keyboard}>
            {ALPHABET.map((letter) => (
              <TouchableOpacity
                key={letter}
                onPress={() => handleLetterClick(letter)}
                disabled={guessedLetters.includes(letter) || terminado}
                style={[styles.key, guessedLetters.includes(letter) && styles.keyDisabled]}
              >
                <Text>{letter}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.attempts}>
            Fallos: {wrongGuesses} / {MAX_ATTEMPTS}
          </Text>

          {gameOver && <Text style={styles.lost}>💀 ¡Perdiste! Era: {cardName}</Text>}
          {gameWon && <Text style={styles.won}>🎉 ¡Ganaste!</Text>}

          {terminado && (
            <TouchableOpacity style={styles.button} onPress={cargarCarta}>
              <Text style={styles.buttonText}>Jugar otra vez</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 10, textAlign: 'center' },
  image: { width: 180, height: 310, resizeMode: 'contain', marginVertical: 10 },
  stats: { marginBottom: 10, fontSize: 16 },
  hintBox: {
    backgroundColor: '#f3ecff',
    padding: 14,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
  },
  hintTitle: { fontWeight: 'bold', marginBottom: 4 },
  hintText: { fontSize: 14 },
  wordContainer: { flexDirection: 'row', marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' },
  letter: { fontSize: 28, marginHorizontal: 4 },
  space: { fontSize: 28, marginHorizontal: 10 },
  keyboard: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
  key: { backgroundColor: '#eee', padding: 10, margin: 4, borderRadius: 4, width: 40, alignItems: 'center' },
  keyDisabled: { backgroundColor: '#ccc' },
  attempts: { fontSize: 16, marginBottom: 10 },
  lost: { color: 'red', fontSize: 18 },
  won: { color: 'green', fontSize: 18 },
  button: { marginTop: 10, padding: 10, backgroundColor: '#4b2c82', borderRadius: 5 },
  buttonText: { color: 'white', fontWeight: 'bold' },
});