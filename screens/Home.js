import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import CoffeeCard from '../components/CoffeeCard'
import CoffeeData from '../data/CoffeeData'
import CocktailData from '../data/CocktailData';
import { auth,  database } from '../firebase/FirebaseSetup'
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/FirebaseSetup";
import NotificationManager from '../components/NotificationManager'
import Sidebar from '../components/Sidebar';
import { writeToDB } from '../firebase/FirebaseHelper';

export default function Home() {
  const navigation = useNavigation();
  const coffeeCategories = ['Espresso', 'Americano', 'Black Coffee', 'Cappucchino', 'Latte', 'Macchiato'];
  const cocktailCategories = ['Coffee Martini', 'Latte Marry']
  const [coffeeActiveCategory, setActiveCoffeeCategory] = useState('Espresso');
  const [cocktailActiveCategory, setActiveCocktailCategory] = useState('Coffee Martini');
  const filteredCoffeeData = CoffeeData.filter((coffee) => coffee.name === coffeeActiveCategory);
  const filteredCocktailData = CocktailData.filter((cocktail) => cocktail.name === cocktailActiveCategory);
  const [profileImage, setProfileImage] = useState(null);
  const currentUser = auth.currentUser;
  const [quote, setQuote] = useState(null); 
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);


  const fetchProfileImage = async (userId) => {
    try {
      const storageRef = ref(storage, `profile_images/${userId}.jpg`);
      const imageUrl = await getDownloadURL(storageRef);
      setProfileImage(imageUrl);
    } catch (error) {
      console.log("Error fetching profile image from storage:", error);
    }
    setProfileImage(null);
  };

  useFocusEffect(
    React.useCallback(() => {
      if (currentUser?.uid) {
        fetchProfileImage(currentUser.uid);
      }
    }, [currentUser])
  );
  

  const handleMenuPress = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  
  const fetchQuote = async () => {
    try {
      const response = await fetch('https://quotes-api-self.vercel.app/quote');
      if (!response.ok) {
        throw new Error('Failed to fetch the quote.');
      }
      const data = await response.json();
      setQuote(data); 
    } catch (error) {
      console.error('Error fetching quote:', error);
      Alert.alert('Error', 'Failed to fetch the quote.');
    }
  };

  function handleAddPress(coffee) {
    const cartItem = {
      userId: auth.currentUser.uid,
      id: coffee.id,
      name: coffee.name,
      imageUri: coffee.imagelink_square,
      price: coffee.prices[1].price,
      sizes: 'M',
      quantity: 1,
    };

    try {
      writeToDB(cartItem, 'cart');
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  }

  return (
    <><ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <FontAwesome name="bars" size={24} color="white"
            onPress={handleMenuPress} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Image
            source={profileImage ? { uri: profileImage } : require('../assets/app_images/avatar.png')}
            style={styles.profileImage} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>Café Bloom Double-life Café</Text>

      {/* Daily Quote Section
      <View style={styles.quoteContainer}>
        <Text style={styles.quoteTitle}>Daily Quote</Text>
        {quote ? (
          <View>
            <Text style={styles.quoteText}>{`"${quote.quote}"`}</Text>
            <Text style={styles.quoteAuthor}>— {quote.author}</Text>
          </View>
        ) : (
          <Text style={styles.quotePlaceholder}>A cup of coffee, onward we stride</Text>
        )}
        <TouchableOpacity style={styles.quoteButton} onPress={fetchQuote}>
          <Text style={styles.quoteButtonText}>Get Daily Quote</Text>
        </TouchableOpacity>
      </View> */}

      <View style={styles.quoteContainer}>
        <Text style={styles.quoteTitle}>Popularity Chart</Text>

        {[
          { name: "CoffeeLover99", likes: 120 },
          { name: "LatteMaster", likes: 110 },
          { name: "BeanQueen", likes: 95 },
          { name: "BrewBro", likes: 90 },
          { name: "CaffeineCat", likes: 85 }
        ].map((user, index) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={styles.quoteText}>
              {index + 1}. {user.name} – {user.likes}
            </Text>
            <FontAwesome name="thumbs-up" size={18} color="#ffd700" style={{ marginLeft: 6 }} />
          </View>
        ))}

        <TouchableOpacity style={styles.quoteButton} onPress={() => console.log('Leaderboard refreshed')}>
          <Text style={styles.quoteButtonText}>Refresh Leaderboard</Text>
        </TouchableOpacity>
      </View>
      
      {/* Divider Title for Coffee */}
      <View style={{ marginTop: 5, marginBottom: 8 }}>
        <Text style={{ fontSize: 30, color: 'white', fontWeight: 'bold' }}>Coffee</Text>
      </View>

      {/* Coffee Category Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {coffeeCategories.map((coffeeCategories, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tab, coffeeActiveCategory === coffeeCategories && styles.activeTab]}
              onPress={() => setActiveCoffeeCategory(coffeeCategories)}
            >
              <Text style={[styles.tabText, coffeeActiveCategory === coffeeCategories && styles.activeTabText]}>
                {coffeeCategories}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Coffee List */}
      <View>
        <ScrollView horizontal>
          {filteredCoffeeData.map((coffee) => (
            <TouchableOpacity
              key={coffee.id}
              onPress={() => navigation.navigate('CoffeeDetail', {coffee})}>
              <CoffeeCard
                key={coffee.id}
                imageUri={coffee.imagelink_square}
                title={coffee.name}
                subtitle={coffee.special_ingredient}
                price={coffee.prices[1].price}
                onAddPress={() => handleAddPress(coffee)}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Divider Title for Cocktail */}
      <View style={{ marginTop: 15, marginBottom: 8 }}>
        <Text style={{ fontSize: 30, color: 'white', fontWeight: 'bold' }}>Cocktails</Text>
      </View>

      {/* Cocktail Category Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {cocktailCategories.map((cocktailCategories, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tab, cocktailActiveCategory === cocktailCategories && styles.activeTab]}
              onPress={() => setActiveCocktailCategory(cocktailCategories)}
            >
              <Text style={[styles.tabText, cocktailActiveCategory === cocktailCategories && styles.activeTabText]}>
                {cocktailCategories}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cocktail List */}
      <View>
        <ScrollView horizontal>
          {filteredCocktailData.map((cocktail) => (
            <TouchableOpacity
              key={cocktail.id}
              onPress={() => navigation.navigate('CoffeeDetail', {cocktail})}>
              <CoffeeCard
                key={cocktail.id}
                imageUri={cocktail.imagelink_square}
                title={cocktail.name}
                subtitle={cocktail.special_ingredient}
                price={cocktail.prices[1].price}
                onAddPress={() => handleAddPress(cocktail)}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
    <Sidebar
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        currentUser={currentUser} /></>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1b1b1b',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    padding: 10,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 45,
    color: 'white',
    fontWeight: 'bold',
    margin: 10,
    width: '80%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  searchInput: {
    color: 'white',
    marginLeft: 10,
    flex: 1,
  },
  quoteContainer: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  quoteTitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  quoteText: {
    fontSize: 16,
    color: 'white',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  quoteAuthor: {
    fontSize: 14,
    color: 'orange',
    textAlign: 'right',
  },
  quotePlaceholder: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 10,
  },
  quoteButton: {
    backgroundColor: 'orange',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  quoteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    marginTop: Platform.OS === 'android' ? -8 : 0,
    height: 30,
  },
  tab: {
    paddingHorizontal: 12,
    marginRight: Platform.OS === 'android' ? 8 : 16,
    height: '100%',
    justifyContent: 'center',
  },
  tabText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: 'orange',
    paddingBottom: 4,
  },
  activeTabText: {
    color: 'orange',
  },
});