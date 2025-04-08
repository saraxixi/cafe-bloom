import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { writeToDB, deleteFromDB } from '../firebase/FirebaseHelper';
import { auth, database } from '../firebase/FirebaseSetup';
import { getDocs, query, where, collection, onSnapshot } from 'firebase/firestore';

export default function CoffeeDetail({ route, navigation }) {
  const item = route.params?.coffee || route.params?.cocktail;
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSize, setSelectedSize] = useState('M');

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId || !item) return;

    const q = query(
      collection(database, 'favorites'),
      where('userId', '==', userId),
      where('coffeeId', '==', item.id)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setIsFavorite(!querySnapshot.empty);
    });

    return () => unsubscribe();
  }, [item?.id]);

  const handleFavoritePress = async () => {
    try {
      const userId = auth.currentUser.uid;

      if (isFavorite) {
        const querySnapshot = await getDocs(
          query(
            collection(database, 'favorites'),
            where('userId', '==', userId),
            where('coffeeId', '==', item.id)
          )
        );

        for (const docSnap of querySnapshot.docs) {
          await deleteFromDB(docSnap.id, 'favorites');
        }
      } else {
        await writeToDB(
          {
            userId: userId,
            coffeeId: item.id,
            name: item.name,
            imageUri: item.imagelink_portrait,
            special_ingredient: item.special_ingredient,
            description: item.description,
            type: item.type,
            ingredients: item.ingredients,
            roasted: item.roasted
          },
          'favorites'
        );
      }

      setIsFavorite(!isFavorite);
    } catch (error) {
      console.log('Error updating favorite:', error);
    }
  };

  const handleAddPress = () => {
    const cartItem = {
      userId: auth.currentUser.uid,
      id: item.id,
      name: item.name,
      imageUri: item.imagelink_square,
      price: getPriceBySize(),
      sizes: selectedSize,
      quantity: 1,
    };

    try {
      writeToDB(cartItem, 'cart');
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const getPriceBySize = () => {
    const selectedPrice = item.prices.find((price) => price.size === selectedSize);
    return selectedPrice ? selectedPrice.price : 'N/A';
  };

  // ❗Fallback in case no item is passed
  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white', padding: 20 }}>No item data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image source={item.imagelink_portrait} style={styles.image} />
        <View style={styles.overlay}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{item.name}</Text>
            <TouchableOpacity onPress={handleFavoritePress}>
              <AntDesign name="heart" style={[styles.icon, isFavorite && styles.redIcon]} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>{item.special_ingredient}</Text>
          <View style={styles.tagsContainer}>
            <Text style={styles.tag}>{item.type}</Text>
            <Text style={styles.tag}>{item.ingredients}</Text>
            <Text style={styles.tag}>{item.roasted}</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{item.description}</Text>

        {/* Size selection */}
        <Text style={styles.sectionTitle}>Size</Text>
        <View style={styles.sizeContainer}>
          {['S', 'M', 'L'].map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.sizeButton, size === selectedSize && styles.sizeActive]}
              onPress={() => setSelectedSize(size)}
            >
              <Text style={[styles.sizeText, size === selectedSize && styles.sizeTextActive]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.price}>${getPriceBySize()}</Text>
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddPress}>
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1e1e1e',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  icon: {
    color: '#fff',
    fontSize: 18,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 500,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  titleContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 8,
  },
  icon: {
    fontSize: 20, 
    color: 'white', 
  },
  redIcon: {
    fontSize: 20,
    color: 'red',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 12,
  },

  tagsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },

  tag: {
    backgroundColor: '#444',
    padding: 8,
    borderRadius: 12,
    color: '#fff',
    fontSize: 12,
    marginRight: 4,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 16,
    lineHeight: 22,
  },
  sizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 16,
  },
  sizeButton: {
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 50,
    borderRadius: 16,
  },
  sizeActive: {
    borderColor: '#ff6b00',
    backgroundColor: '#1e1e1e',
  },
  sizeText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  sizeTextActive: {
    color: '#ff6b00',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addToCartButton: {
    backgroundColor: '#ff6b00',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 16,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
