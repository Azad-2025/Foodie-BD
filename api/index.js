// server/api.ts
import "dotenv/config";
import express from "express";

// server/routes.ts
import { Router } from "express";
import crypto4 from "crypto";
import multer from "multer";

// server/db.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";

// src/data/divisionsAndDistricts.ts
var DIVISIONS = [
  { id: "dhaka", nameEn: "Dhaka", nameBn: "\u09A2\u09BE\u0995\u09BE", capitalEn: "Dhaka", capitalBn: "\u09A2\u09BE\u0995\u09BE" },
  { id: "chattogram", nameEn: "Chattogram", nameBn: "\u099A\u099F\u09CD\u099F\u0997\u09CD\u09B0\u09BE\u09AE", capitalEn: "Chattogram", capitalBn: "\u099A\u099F\u09CD\u099F\u0997\u09CD\u09B0\u09BE\u09AE" },
  { id: "rajshahi", nameEn: "Rajshahi", nameBn: "\u09B0\u09BE\u099C\u09B6\u09BE\u09B9\u09C0", capitalEn: "Rajshahi", capitalBn: "\u09B0\u09BE\u099C\u09B6\u09BE\u09B9\u09C0" },
  { id: "khulna", nameEn: "Khulna", nameBn: "\u0996\u09C1\u09B2\u09A8\u09BE", capitalEn: "Khulna", capitalBn: "\u0996\u09C1\u09B2\u09A8\u09BE" },
  { id: "barishal", nameEn: "Barishal", nameBn: "\u09AC\u09B0\u09BF\u09B6\u09BE\u09B2", capitalEn: "Barishal", capitalBn: "\u09AC\u09B0\u09BF\u09B6\u09BE\u09B2" },
  { id: "sylhet", nameEn: "Sylhet", nameBn: "\u09B8\u09BF\u09B2\u09C7\u099F", capitalEn: "Sylhet", capitalBn: "\u09B8\u09BF\u09B2\u09C7\u099F" },
  { id: "rangpur", nameEn: "Rangpur", nameBn: "\u09B0\u0982\u09AA\u09C1\u09B0", capitalEn: "Rangpur", capitalBn: "\u09B0\u0982\u09AA\u09C1\u09B0" },
  { id: "mymensingh", nameEn: "Mymensingh", nameBn: "\u09AE\u09AF\u09BC\u09AE\u09A8\u09B8\u09BF\u0982\u09B9", capitalEn: "Mymensingh", capitalBn: "\u09AE\u09AF\u09BC\u09AE\u09A8\u09B8\u09BF\u0982\u09B9" }
];
var FOOD_CATEGORIES = [
  { id: "main_course", nameEn: "Main Course", nameBn: "\u09AA\u09CD\u09B0\u09A7\u09BE\u09A8 \u0996\u09BE\u09AC\u09BE\u09B0", description: "Rich biryanis, mezban curries, and regional rice delicacies" },
  { id: "sweets_pitha", nameEn: "Sweets & Pitha", nameBn: "\u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u0993 \u09AA\u09BF\u09A0\u09BE", description: "Heritage mishti, curd, and seasonal handmade pithas" },
  { id: "traditional", nameEn: "Traditional Food", nameBn: "\u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0996\u09BE\u09AC\u09BE\u09B0", description: "Century-old heritage recipes passed through generations" },
  { id: "street_food", nameEn: "Street Food", nameBn: "\u09AA\u09A5\u0996\u09BE\u09AC\u09BE\u09B0", description: "Famous bazaar snacks, chotpoti, fuchka, and street kebabs" },
  { id: "snacks", nameEn: "Snacks & Bakes", nameBn: "\u09A8\u09BE\u09B8\u09CD\u09A4\u09BE \u0993 \u09AC\u09C7\u0995\u09BE\u09B0\u09BF", description: "Bakarkhani, savory chanachur, and evening tea companions" },
  { id: "dessert", nameEn: "Dessert", nameBn: "\u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8", description: "Cooling puddings, kulfi, firni, and sweet curd" },
  { id: "drinks", nameEn: "Drinks & Beverages", nameBn: "\u09AA\u09BE\u09A8\u09C0\u09AF\u09BC", description: "Seven-color tea, matha, borhani, and fresh fruit sherbets" }
];
var DISTRICTS = [
  // Dhaka Division (13)
  {
    id: "dhaka",
    divisionId: "dhaka",
    nameEn: "Dhaka",
    nameBn: "\u09A2\u09BE\u0995\u09BE",
    shapeName: "Dhaka",
    lat: 23.8103,
    lng: 90.4125,
    prominentDishEn: "Kacchi Biryani & Bakarkhani",
    prominentDishBn: "\u0995\u09BE\u099A\u09CD\u099A\u09BF \u09AC\u09BF\u09B0\u09BF\u09AF\u09BC\u09BE\u09A8\u09BF \u0993 \u09AC\u09BE\u0995\u09B0\u0996\u09BE\u09A8\u09BF",
    description: "Capital city famed for Mughal culinary heritage in Old Dhaka, including slow-cooked Kacchi Biryani, flaky Bakarkhani, and rich Shahi Haleem."
  },
  {
    id: "gazipur",
    divisionId: "dhaka",
    nameEn: "Gazipur",
    nameBn: "\u0997\u09BE\u099C\u09C0\u09AA\u09C1\u09B0",
    shapeName: "Gazipur",
    lat: 24.0023,
    lng: 90.4264,
    prominentDishEn: "Kathal (Jackfruit) Delicacies",
    prominentDishBn: "\u0995\u09BE\u0981\u09A0\u09BE\u09B2\u09C7\u09B0 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09AA\u09A6",
    description: "Known for producing Bangladesh's prime national fruit jackfruit, crafted into sweet payesh, seasonal curries, and roasted seed snacks."
  },
  {
    id: "narayanganj",
    divisionId: "dhaka",
    nameEn: "Narayanganj",
    nameBn: "\u09A8\u09BE\u09B0\u09BE\u09AF\u09BC\u09A3\u0997\u099E\u09CD\u099C",
    shapeName: "Narayanganj",
    lat: 23.6238,
    lng: 90.5,
    prominentDishEn: "Murabba & Sonargaon Sweets",
    prominentDishBn: "\u09AE\u09CB\u09B0\u09AC\u09CD\u09AC\u09BE \u0993 \u09B8\u09CB\u09A8\u09BE\u09B0\u0997\u09BE\u0981\u09AF\u09BC\u09C7\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    description: "Historic ancient capital Sonargaon with rich fruit preserves (Murabba), fresh chhana sweets, and historic riverside tea culture."
  },
  {
    id: "narsingdi",
    divisionId: "dhaka",
    nameEn: "Narsingdi",
    nameBn: "\u09A8\u09B0\u09B8\u09BF\u0982\u09A6\u09C0",
    shapeName: "Narsingdi",
    lat: 23.9322,
    lng: 90.7154,
    prominentDishEn: "Amriti & Sagar Kola",
    prominentDishBn: "\u0985\u09AE\u09C3\u09A4\u09BF \u0993 \u09B8\u09BE\u0997\u09B0 \u0995\u09B2\u09BE",
    description: "Renowned for aromatic Amriti sweets dipped in cardamom syrup and sweet local plantains."
  },
  {
    id: "munshiganj",
    divisionId: "dhaka",
    nameEn: "Munshiganj",
    nameBn: "\u09AE\u09C1\u09A8\u09CD\u09B8\u09C0\u0997\u099E\u09CD\u099C",
    shapeName: "Munshiganj",
    lat: 23.5422,
    lng: 90.5305,
    prominentDishEn: "Bhagyakul Mistanna & Aloor Dum",
    prominentDishBn: "\u09AD\u09BE\u0997\u09CD\u09AF\u0995\u09C2\u09B2\u09C7\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8 \u0993 \u0986\u09B2\u09C1\u09B0 \u09A6\u09AE",
    description: "Home to Bikrampur culinary excellence, notable for century-old Bhagyakul royal dairy sweets and Bikrampur pitha."
  },
  {
    id: "manikganj",
    divisionId: "dhaka",
    nameEn: "Manikganj",
    nameBn: "\u09AE\u09BE\u09A8\u09BF\u0995\u0997\u099E\u09CD\u099C",
    shapeName: "Manikganj",
    lat: 23.8617,
    lng: 90.0003,
    prominentDishEn: "Jholir Gur Sandesh",
    prominentDishBn: "\u099D\u09CB\u09B2\u09BF\u09B0 \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6",
    description: "Famous for organic date palm liquid jaggery (Jholir Gur) harvested in winter and folded into aromatic sandesh."
  },
  {
    id: "tangail",
    divisionId: "dhaka",
    nameEn: "Tangail",
    nameBn: "\u099F\u09BE\u0999\u09CD\u0997\u09BE\u0987\u09B2",
    shapeName: "Tangail",
    lat: 24.2513,
    lng: 89.9167,
    prominentDishEn: "Porabari Chomchom",
    prominentDishBn: "\u09AA\u09CB\u09A1\u09BC\u09BE\u09AC\u09BE\u09A1\u09BC\u09BF\u09B0 \u099A\u09AE\u099A\u09AE",
    description: "Undisputed birthplace of the celebrated Porabari Chomchom, coated with dried mawa and deeply infused with caramelized syrup."
  },
  {
    id: "kishoreganj",
    divisionId: "dhaka",
    nameEn: "Kishoreganj",
    nameBn: "\u0995\u09BF\u09B6\u09CB\u09B0\u0997\u099E\u09CD\u099C",
    shapeName: "Kishoreganj",
    lat: 24.4449,
    lng: 90.7766,
    prominentDishEn: "Balish Mishti & Haor Fish Curry",
    prominentDishBn: "\u09AC\u09BE\u09B2\u09BF\u09B6 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u0993 \u09B9\u09BE\u0993\u09B0\u09C7\u09B0 \u09AE\u09BE\u099B",
    description: "Pillow-shaped jumbo sweets soaked in thickened malai and fresh wild catch from the wetlands of Nikli."
  },
  {
    id: "faridpur",
    divisionId: "dhaka",
    nameEn: "Faridpur",
    nameBn: "\u09AB\u09B0\u09BF\u09A6\u09AA\u09C1\u09B0",
    shapeName: "Faridpur",
    lat: 23.6071,
    lng: 89.8429,
    prominentDishEn: "Khejur Gurer Payesh",
    prominentDishBn: "\u0996\u09C7\u099C\u09C1\u09B0 \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09AA\u09BE\u09AF\u09BC\u09C7\u09B8",
    description: "Famed date palm orchard region renowned for rich, fragrant molasses used in winter rice pudding and traditional pitha."
  },
  {
    id: "gopalganj",
    divisionId: "dhaka",
    nameEn: "Gopalganj",
    nameBn: "\u0997\u09CB\u09AA\u09BE\u09B2\u0997\u099E\u09CD\u099C",
    shapeName: "Gopalganj",
    lat: 23.0051,
    lng: 89.8267,
    prominentDishEn: "Rosogolla & Til-er Khaja",
    prominentDishBn: "\u09B0\u09B8\u0997\u09CB\u09B2\u09CD\u09B2\u09BE \u0993 \u09A4\u09BF\u09B2\u09C7\u09B0 \u0996\u09BE\u099C\u09BE",
    description: "Known for spongy pure cow-milk Rosogolla and crunchy sesame seed brittle."
  },
  {
    id: "madaripur",
    divisionId: "dhaka",
    nameEn: "Madaripur",
    nameBn: "\u09AE\u09BE\u09A6\u09BE\u09B0\u09C0\u09AA\u09C1\u09B0",
    shapeName: "Madaripur",
    lat: 23.1641,
    lng: 90.1897,
    prominentDishEn: "Khejur Rosh Sweets",
    prominentDishBn: "\u0996\u09C7\u099C\u09C1\u09B0 \u09B0\u09B8\u09C7\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    description: "Celebrated for artisan sweetmakers utilizing authentic riverside date sap."
  },
  {
    id: "rajbari",
    divisionId: "dhaka",
    nameEn: "Rajbari",
    nameBn: "\u09B0\u09BE\u099C\u09AC\u09BE\u09A1\u09BC\u09C0",
    shapeName: "Rajbari",
    lat: 23.7574,
    lng: 89.6445,
    prominentDishEn: "Chamcham & Kheer Sandesh",
    prominentDishBn: "\u099A\u09AE\u099A\u09AE \u0993 \u0995\u09CD\u09B7\u09C0\u09B0 \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6",
    description: "Historic Padma river crossing famous for golden chamcham and rich dried curd confectionery."
  },
  {
    id: "shariatpur",
    divisionId: "dhaka",
    nameEn: "Shariatpur",
    nameBn: "\u09B6\u09B0\u09C0\u09AF\u09BC\u09A4\u09AA\u09C1\u09B0",
    shapeName: "Shariatpur",
    lat: 23.2423,
    lng: 90.4348,
    prominentDishEn: "Bibikhana Pitha",
    prominentDishBn: "\u09AC\u09BF\u09AC\u09BF\u0996\u09BE\u09A8\u09BE \u09AA\u09BF\u09A0\u09BE",
    description: "Traditional home of rich baked rice-cake Bibikhana pitha made with jaggery, thick coconut milk, and ghee."
  },
  // Chattogram Division (11)
  {
    id: "chattogram",
    divisionId: "chattogram",
    nameEn: "Chattogram",
    nameBn: "\u099A\u099F\u09CD\u099F\u0997\u09CD\u09B0\u09BE\u09AE",
    shapeName: "Chittagong",
    lat: 22.3569,
    lng: 91.7832,
    prominentDishEn: "Mezban Gosht & Kala Bhuna",
    prominentDishBn: "\u09AE\u09C7\u099C\u09AC\u09BE\u09A8\u09BF \u0997\u09CB\u09B6\u09A4 \u0993 \u0995\u09BE\u09B2\u09BE \u09AD\u09C1\u09A8\u09BE",
    description: "Culinary jewel of southeastern Bangladesh, home to legendary spicy slow-roasted Kala Bhuna and communal feast Mezban beef."
  },
  {
    id: "coxs_bazar",
    divisionId: "chattogram",
    nameEn: "Cox's Bazar",
    nameBn: "\u0995\u0995\u09CD\u09B8\u09AC\u09BE\u099C\u09BE\u09B0",
    shapeName: "Cox's Bazar",
    lat: 21.4272,
    lng: 92.0058,
    prominentDishEn: "Chhuri Shutki Bhorta & Coral Fish",
    prominentDishBn: "\u099B\u09C1\u09B0\u09BF \u09B6\u09C1\u0981\u099F\u0995\u09BF \u09AD\u09B0\u09CD\u09A4\u09BE \u0993 \u0995\u09CB\u09B0\u09BE\u09B2 \u09AE\u09BE\u099B",
    description: "World's longest sea beach accompanied by sun-dried spicy ribbon fish (Shutki) and grilled coastal catch."
  },
  {
    id: "cumilla",
    divisionId: "chattogram",
    nameEn: "Cumilla",
    nameBn: "\u0995\u09C1\u09AE\u09BF\u09B2\u09CD\u09B2\u09BE",
    shapeName: "Comilla",
    lat: 23.4607,
    lng: 91.1809,
    prominentDishEn: "Matri Bhander Rasmalai",
    prominentDishBn: "\u09AE\u09BE\u09A4\u09C3\u09AD\u09BE\u09A3\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u09B0\u09B8\u09AE\u09BE\u09B2\u09BE\u0987",
    description: "The iconic national home of authentic Rasmalai by Matri Bhander, with tiny clotted cream pillows bathed in condensed milk."
  },
  {
    id: "brahmanbaria",
    divisionId: "chattogram",
    nameEn: "Brahmanbaria",
    nameBn: "\u09AC\u09CD\u09B0\u09BE\u09B9\u09CD\u09AE\u09A3\u09AC\u09BE\u09A1\u09BC\u09BF\u09AF\u09BC\u09BE",
    shapeName: "Brahamanbaria",
    lat: 23.9571,
    lng: 91.1115,
    prominentDishEn: "Chanar Mukhi",
    prominentDishBn: "\u099B\u09BE\u09A8\u09BE\u09B0 \u09AE\u09C1\u0996\u09C0",
    description: "Exclusive GI-tagged sweet confection crafted into small diamond bites coated in crisp crystalized sugar."
  },
  {
    id: "chandpur",
    divisionId: "chattogram",
    nameEn: "Chandpur",
    nameBn: "\u099A\u09BE\u0981\u09A6\u09AA\u09C1\u09B0",
    shapeName: "Chandpur",
    lat: 23.2333,
    lng: 90.6667,
    prominentDishEn: "Padma-Meghna Ilish Paturi",
    prominentDishBn: "\u09AA\u09A6\u09CD\u09AE\u09BE-\u09AE\u09C7\u0998\u09A8\u09BE\u09B0 \u09B0\u09C2\u09AA\u09BE\u09B2\u09BF \u0987\u09B2\u09BF\u09B6 \u09AA\u09BE\u09A4\u09C1\u09B0\u09BF",
    description: "The premier capital of national fish Hilsa, where the Padma and Meghna rivers converge to yield the tastiest oily silver Hilsa."
  },
  {
    id: "feni",
    divisionId: "chattogram",
    nameEn: "Feni",
    nameBn: "\u09AB\u09C7\u09A8\u09C0",
    shapeName: "Feni",
    lat: 23.0159,
    lng: 91.3976,
    prominentDishEn: "Khondol-er Mishti",
    prominentDishBn: "\u0996\u09A8\u09CD\u09A6\u09B2\u09C7\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    description: "Historic sweet treats prepared in Khondol bazaar with unmatched curd texture."
  },
  {
    id: "lakshmipur",
    divisionId: "chattogram",
    nameEn: "Lakshmipur",
    nameBn: "\u09B2\u0995\u09CD\u09B7\u09CD\u09AE\u09C0\u09AA\u09C1\u09B0",
    shapeName: "Lakshmipur",
    lat: 22.9425,
    lng: 90.8412,
    prominentDishEn: "Moyish-er Doi (Buffalo Curd)",
    prominentDishBn: "\u09AE\u09B9\u09BF\u09B7\u09C7\u09B0 \u09A6\u09C1\u09A7\u09C7\u09B0 \u09A6\u0987",
    description: "Dense, naturally set coastal buffalo milk curd served in traditional clay bowls with molasses."
  },
  {
    id: "noakhali",
    divisionId: "chattogram",
    nameEn: "Noakhali",
    nameBn: "\u09A8\u09CB\u09AF\u09BC\u09BE\u0996\u09BE\u09B2\u09C0",
    shapeName: "Noakhali",
    lat: 22.8696,
    lng: 91.0991,
    prominentDishEn: "Narikel Naru & Khola Jaal Pitha",
    prominentDishBn: "\u09A8\u09BE\u09B0\u0995\u09C7\u09B2 \u09A8\u09BE\u09A1\u09BC\u09C1 \u0993 \u0996\u09CB\u09B2\u09BE\u099C\u09BE \u09AA\u09BF\u09A0\u09BE",
    description: "Rich coconut haven, famed for paper-thin lacey egg crepe (Khola Jaal) and coconut sweets."
  },
  {
    id: "bandarban",
    divisionId: "chattogram",
    nameEn: "Bandarban",
    nameBn: "\u09AC\u09BE\u09A8\u09CD\u09A6\u09B0\u09AC\u09BE\u09A8",
    shapeName: "Bandarban",
    lat: 22.1953,
    lng: 92.2184,
    prominentDishEn: "Bamboo Chicken & Mundi",
    prominentDishBn: "\u09AC\u09BE\u0981\u09B6 \u09AE\u09C1\u09B0\u0997\u09BF \u0993 \u09AE\u09C1\u09A8\u09CD\u09A6\u09BF \u09A8\u09C1\u09A1\u09C1\u09B2\u09B8",
    description: "Hill Tracts indigenous cuisine featuring organic chicken steamed inside fresh green bamboo stalks with jungle herbs."
  },
  {
    id: "rangamati",
    divisionId: "chattogram",
    nameEn: "Rangamati",
    nameBn: "\u09B0\u09BE\u0999\u09CD\u0997\u09BE\u09AE\u09BE\u099F\u09BF",
    shapeName: "Rangamati",
    lat: 22.7324,
    lng: 92.2985,
    prominentDishEn: "Hezon & Kaptai Lake Fish",
    prominentDishBn: "\u09B9\u09C7\u099C\u09A8 \u0993 \u0995\u09BE\u09AA\u09CD\u09A4\u09BE\u0987 \u09B2\u09C7\u0995\u09C7\u09B0 \u09A4\u09BE\u099C\u09BE \u09AE\u09BE\u099B",
    description: "Chakma and Marma traditional delicacies cooked with bamboo shoot, aromatic leaves, and freshly caught Kaptai lake fish."
  },
  {
    id: "khagrachhari",
    divisionId: "chattogram",
    nameEn: "Khagrachhari",
    nameBn: "\u0996\u09BE\u0997\u09A1\u09BC\u09BE\u099B\u09A1\u09BC\u09BF",
    shapeName: "Khagrachhari",
    lat: 23.1193,
    lng: 91.9847,
    prominentDishEn: "Pachon & Indigenous Herbs",
    prominentDishBn: "\u09AA\u09BE\u099C\u09A8 \u09A4\u09B0\u0995\u09BE\u09B0\u09BF \u0993 \u09AA\u09BE\u09B9\u09BE\u09A1\u09BC\u09BF \u09B6\u09BE\u0995",
    description: "Celebrated Bizu festive dish Pachon, made with over 30 varieties of wild mountain herbs and vegetables."
  },
  // Rajshahi Division (8)
  {
    id: "rajshahi",
    divisionId: "rajshahi",
    nameEn: "Rajshahi",
    nameBn: "\u09B0\u09BE\u099C\u09B6\u09BE\u09B9\u09C0",
    shapeName: "Rajshahi",
    lat: 24.3636,
    lng: 88.6241,
    prominentDishEn: "Kalai Ruti & Fazli Mango Delicacies",
    prominentDishBn: "\u0995\u09BE\u09B2\u09BE\u0987 \u09B0\u09C1\u099F\u09BF \u0993 \u09AB\u099C\u09B2\u09BF \u0986\u09AE\u09C7\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8",
    description: "Silk city famed for earthen-pan toasted black gram Kalai Ruti served with smoked eggplant and fiery chili paste."
  },
  {
    id: "bogura",
    divisionId: "rajshahi",
    nameEn: "Bogura",
    nameBn: "\u09AC\u0997\u09C1\u09A1\u09BC\u09BE",
    shapeName: "Bogra",
    lat: 24.8465,
    lng: 89.3777,
    prominentDishEn: "Bogurar Mishti Doi",
    prominentDishBn: "\u09AC\u0997\u09C1\u09A1\u09BC\u09BE\u09B0 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09A6\u0987",
    description: "Internationally celebrated red-clay pottery sweet curd, caramelized to silky perfection using Gauripara artisanal methods."
  },
  {
    id: "pabna",
    divisionId: "rajshahi",
    nameEn: "Pabna",
    nameBn: "\u09AA\u09BE\u09AC\u09A8\u09BE",
    shapeName: "Pabna",
    lat: 24.0044,
    lng: 89.2372,
    prominentDishEn: "Pabnar Peda & Ghee Sandesh",
    prominentDishBn: "\u09AA\u09BE\u09AC\u09A8\u09BE\u09B0 \u09AA\u09CD\u09AF\u09BE\u09B0\u09BE \u0993 \u0996\u09BE\u0981\u099F\u09BF \u0998\u09BF\u09AF\u09BC\u09C7\u09B0 \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6",
    description: "Milk belt of northern Bengal, creating dense melt-in-mouth milk Peda and unadulterated cow ghee."
  },
  {
    id: "sirajganj",
    divisionId: "rajshahi",
    nameEn: "Sirajganj",
    nameBn: "\u09B8\u09BF\u09B0\u09BE\u099C\u0997\u099E\u09CD\u099C",
    shapeName: "Sirajganj",
    lat: 24.4534,
    lng: 89.7008,
    prominentDishEn: "Sirajganj-er Ponir (Curd Cheese)",
    prominentDishBn: "\u09B8\u09BF\u09B0\u09BE\u099C\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u09AA\u09A8\u09BF\u09B0",
    description: "Artisanal cow milk cheese wheel (Ponir) aged naturally, a staple for traditional bakeries and snacks."
  },
  {
    id: "natore",
    divisionId: "rajshahi",
    nameEn: "Natore",
    nameBn: "\u09A8\u09BE\u099F\u09CB\u09B0",
    shapeName: "Natore",
    lat: 24.4206,
    lng: 88.9324,
    prominentDishEn: "Natorer Kachagolla",
    prominentDishBn: "\u09A8\u09BE\u099F\u09CB\u09B0\u09C7\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u0995\u09BE\u0981\u099A\u09BE\u0997\u09CB\u09B2\u09CD\u09B2\u09BE",
    description: "Famed heritage dessert of fresh un-cooked chhana infused with light sugar syrup, originating from the Natore Rajbari royal kitchens."
  },
  {
    id: "naogaon",
    divisionId: "rajshahi",
    nameEn: "Naogaon",
    nameBn: "\u09A8\u0993\u0997\u09BE\u0981",
    shapeName: "Naogaon",
    lat: 24.8108,
    lng: 88.9416,
    prominentDishEn: "Peda & Chhana Mishti",
    prominentDishBn: "\u09A8\u0993\u0997\u09BE\u0981\u09B0 \u09AA\u09CD\u09AF\u09BE\u09B0\u09BE \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6",
    description: "Pahar-pur heritage district producing exquisite condensed milk peda and aromatic Miniket rice."
  },
  {
    id: "chapai_nawabganj",
    divisionId: "rajshahi",
    nameEn: "Chapai Nawabganj",
    nameBn: "\u099A\u09BE\u0981\u09AA\u09BE\u0987\u09A8\u09AC\u09BE\u09AC\u0997\u099E\u09CD\u099C",
    shapeName: "Nawabganj",
    lat: 24.5965,
    lng: 88.2775,
    prominentDishEn: "Shibganj-er Chomchom & Mangoes",
    prominentDishBn: "\u09B6\u09BF\u09AC\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u099A\u09AE\u099A\u09AE \u0993 \u0996\u09BF\u09B0\u09B8\u09BE\u09AA\u09BE\u09A4 \u0986\u09AE",
    description: "The mango capital of Bangladesh, coupled with the dense, golden Shibganj Chomchom."
  },
  {
    id: "joypurhat",
    divisionId: "rajshahi",
    nameEn: "Joypurhat",
    nameBn: "\u099C\u09AF\u09BC\u09AA\u09C1\u09B0\u09B9\u09BE\u099F",
    shapeName: "Joypurhat",
    lat: 25.1015,
    lng: 89.0277,
    prominentDishEn: "Bel-er Shorbot & Pitha",
    prominentDishBn: "\u09AC\u09C7\u09B2\u09C7\u09B0 \u09B6\u09B0\u09AC\u09A4 \u0993 \u09AA\u09BF\u09A0\u09BE\u09AA\u09C1\u09B2\u09BF",
    description: "Wood-apple nectar and seasonal rural pithas prepared with fresh winter harvest."
  },
  // Khulna Division (10)
  {
    id: "khulna",
    divisionId: "khulna",
    nameEn: "Khulna",
    nameBn: "\u0996\u09C1\u09B2\u09A8\u09BE",
    shapeName: "Khulna",
    lat: 22.8456,
    lng: 89.5403,
    prominentDishEn: "Chui Jhal Khasir Mangsho",
    prominentDishBn: "\u099A\u09C1\u0987\u099D\u09BE\u09B2 \u09A6\u09BF\u09AF\u09BC\u09C7 \u0996\u09BE\u09B8\u09BF\u09B0 \u09AE\u09BE\u0982\u09B8",
    description: "Famed culinary trademark using Piper chaba (Chui Jhal) vine stems cooked into intensely fragrant, spicy mutton."
  },
  {
    id: "bagerhat",
    divisionId: "khulna",
    nameEn: "Bagerhat",
    nameBn: "\u09AC\u09BE\u0997\u09C7\u09B0\u09B9\u09BE\u099F",
    shapeName: "Bagerhat",
    lat: 22.6602,
    lng: 89.7895,
    prominentDishEn: "Sundarbans Honey Delicacies & Crab",
    prominentDishBn: "\u09B8\u09C1\u09A8\u09CD\u09A6\u09B0\u09AC\u09A8\u09C7\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u09AE\u09A7\u09C1 \u0993 \u0995\u09BE\u0981\u0995\u09A1\u09BC\u09BE \u09AD\u09C1\u09A8\u09BE",
    description: "Gateway to mangrove Sundarbans, known for wild mangrove blossom honey treats and spicy coastal mud crab."
  },
  {
    id: "satkhira",
    divisionId: "khulna",
    nameEn: "Satkhira",
    nameBn: "\u09B8\u09BE\u09A4\u0995\u09CD\u09B7\u09C0\u09B0\u09BE",
    shapeName: "Satkhira",
    lat: 22.7185,
    lng: 89.0705,
    prominentDishEn: "Satkhirar Sandesh & Golda Chingri",
    prominentDishBn: "\u09B8\u09BE\u09A4\u0995\u09CD\u09B7\u09C0\u09B0\u09BE\u09B0 \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6 \u0993 \u0997\u09B2\u09A6\u09BE \u099A\u09BF\u0982\u09A1\u09BC\u09BF",
    description: "Pure coastal cow milk sandesh and world-class freshwater jumbo prawns (Golda Chingri)."
  },
  {
    id: "jashore",
    divisionId: "khulna",
    nameEn: "Jashore",
    nameBn: "\u09AF\u09B6\u09CB\u09B0",
    shapeName: "Jessore",
    lat: 23.1664,
    lng: 89.2081,
    prominentDishEn: "Jamtolar Mishti & Patali Gur",
    prominentDishBn: "\u099C\u09BE\u09AE\u09A4\u09B2\u09BE\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u0993 \u09A8\u09B2\u09C7\u09A8 \u09AA\u09BE\u099F\u09BE\u09B2\u09BF \u0997\u09C1\u09A1\u09BC",
    description: "Pioneering home of date palm jaggery (Patali Gur) and the famed century-old Jamtola sweets."
  },
  {
    id: "jhenaidah",
    divisionId: "khulna",
    nameEn: "Jhenaidah",
    nameBn: "\u099D\u09BF\u09A8\u09BE\u0987\u09A6\u09B9",
    shapeName: "Jhenaidah",
    lat: 23.545,
    lng: 89.1726,
    prominentDishEn: "Khejur Rosh Pitha & Sweets",
    prominentDishBn: "\u0996\u09C7\u099C\u09C1\u09B0 \u09B0\u09B8\u09C7\u09B0 \u09AA\u09BF\u09A0\u09BE \u0993 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8",
    description: "Rich agricultural belt noted for fresh date sap winter festivals and traditional chhana creations."
  },
  {
    id: "magura",
    divisionId: "khulna",
    nameEn: "Magura",
    nameBn: "\u09AE\u09BE\u0997\u09C1\u09B0\u09BE",
    shapeName: "Magura",
    lat: 23.4873,
    lng: 89.4198,
    prominentDishEn: "Batasa & Kadma",
    prominentDishBn: "\u09AC\u09BE\u09A4\u09BE\u09B8\u09BE \u0993 \u0995\u09A6\u09AE\u09BE",
    description: "Traditional artisanal confectionery crafters making airy batasa and festive sugar figurines."
  },
  {
    id: "narail",
    divisionId: "khulna",
    nameEn: "Narail",
    nameBn: "\u09A8\u09A1\u09BC\u09BE\u0987\u09B2",
    shapeName: "Narail",
    lat: 23.1725,
    lng: 89.5127,
    prominentDishEn: "Chhit Ruti & Deshi Chitol",
    prominentDishBn: "\u099B\u09BF\u099F \u09B0\u09C1\u099F\u09BF \u0993 \u09A6\u09C7\u09B6\u09BF \u099A\u09BF\u09A4\u09B2 \u09AE\u09BE\u099B",
    description: "River Chitra delicacies including perforated rice-flour Chhit Ruti and flavorful clown knifefish curry."
  },
  {
    id: "kushtia",
    divisionId: "khulna",
    nameEn: "Kushtia",
    nameBn: "\u0995\u09C1\u09B7\u09CD\u099F\u09BF\u09AF\u09BC\u09BE",
    shapeName: "Kushtia",
    lat: 23.9013,
    lng: 89.1205,
    prominentDishEn: "Tiler Khaja & Kulfi Malai",
    prominentDishBn: "\u09A4\u09BF\u09B2\u09C7\u09B0 \u0996\u09BE\u099C\u09BE \u0993 \u0995\u09C1\u09B2\u09AB\u09BF \u09AE\u09BE\u09B2\u09BE\u0987",
    description: "Lalon Shah's mystic land, celebrated for paper-crisp sesame brittle (Tiler Khaja) and creamy pistachio Kulfi."
  },
  {
    id: "chuadanga",
    divisionId: "khulna",
    nameEn: "Chuadanga",
    nameBn: "\u099A\u09C1\u09AF\u09BC\u09BE\u09A1\u09BE\u0999\u09CD\u0997\u09BE",
    shapeName: "Chuadanga",
    lat: 23.6402,
    lng: 88.8418,
    prominentDishEn: "Sarbhaja & Sarpuria",
    prominentDishBn: "\u09B8\u09B0\u09AD\u09BE\u099C\u09BE \u0993 \u09B8\u09B0\u09AA\u09C1\u09B0\u09BF\u09AF\u09BC\u09BE",
    description: "Layered milk-skin (Sar) delicacies fried and soaked in delicate saffron syrup."
  },
  {
    id: "meherpur",
    divisionId: "khulna",
    nameEn: "Meherpur",
    nameBn: "\u09AE\u09C7\u09B9\u09C7\u09B0\u09AA\u09C1\u09B0",
    shapeName: "Meherpur",
    lat: 23.7751,
    lng: 88.6318,
    prominentDishEn: "Sabitri & Roshkodom",
    prominentDishBn: "\u09B8\u09BE\u09AC\u09BF\u09A4\u09CD\u09B0\u09C0 \u0993 \u09B0\u09B8\u0995\u09A6\u09AE",
    description: "Historic Mujibnagar district with century-old Sabitri sweet, famous for keeping freshness for weeks without cooling."
  },
  // Barishal Division (6)
  {
    id: "barishal",
    divisionId: "barishal",
    nameEn: "Barishal",
    nameBn: "\u09AC\u09B0\u09BF\u09B6\u09BE\u09B2",
    shapeName: "Barisal",
    lat: 22.701,
    lng: 90.3535,
    prominentDishEn: "Balam Rice & Ilish Bhapa",
    prominentDishBn: "\u09AC\u09BE\u09B2\u09BE\u09AE \u099A\u09BE\u09B2\u09C7\u09B0 \u09AD\u09BE\u09A4 \u0993 \u0987\u09B2\u09BF\u09B6 \u09AD\u09BE\u09AA\u09BE",
    description: "Granary of Bengal, famous for sweet aromatic Balam rice and steaming mustard Hilsa (Ilish Bhapa)."
  },
  {
    id: "bhola",
    divisionId: "barishal",
    nameEn: "Bhola",
    nameBn: "\u09AD\u09CB\u09B2\u09BE",
    shapeName: "Bhola",
    lat: 22.6859,
    lng: 90.6481,
    prominentDishEn: "Moyish-er Doodher Doi",
    prominentDishBn: "\u09AE\u09B9\u09BF\u09B7\u09C7\u09B0 \u0995\u09BE\u0981\u099A\u09BE \u09A6\u09C1\u09A7\u09C7\u09B0 \u09A6\u0987",
    description: "Island district famed across Bengal for thick curd set in wild hogla-leaf wrapped clay containers from grass-fed buffaloes."
  },
  {
    id: "jhalokati",
    divisionId: "barishal",
    nameEn: "Jhalokati",
    nameBn: "\u099D\u09BE\u09B2\u0995\u09BE\u09A0\u09BF",
    shapeName: "Jhalokati",
    lat: 22.6406,
    lng: 90.1987,
    prominentDishEn: "Floating Market Guava & Chhana Sweets",
    prominentDishBn: "\u09AD\u09BE\u09B8\u09AE\u09BE\u09A8 \u09AC\u09BE\u099C\u09BE\u09B0\u09C7\u09B0 \u09AA\u09C7\u09AF\u09BC\u09BE\u09B0\u09BE \u0993 \u099B\u09BE\u09A8\u09BE\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    description: "Home of the picturesque floating guava markets and fresh dairy sweets prepared along the canal banks."
  },
  {
    id: "pirojpur",
    divisionId: "barishal",
    nameEn: "Pirojpur",
    nameBn: "\u09AA\u09BF\u09B0\u09CB\u099C\u09AA\u09C1\u09B0",
    shapeName: "Pirojpur",
    lat: 22.5841,
    lng: 89.972,
    prominentDishEn: "Amra Morobba & Pitha",
    prominentDishBn: "\u0986\u09AE\u09A1\u09BC\u09BE \u09AE\u09CB\u09B0\u09AC\u09CD\u09AC\u09BE \u0993 \u09AC\u09BF\u09AD\u09BF\u09A8\u09CD\u09A8 \u09AA\u09BF\u09A0\u09BE",
    description: "Famous for hog plum (Amra) preserves and coconut-infused river delta pitha."
  },
  {
    id: "barguna",
    divisionId: "barishal",
    nameEn: "Barguna",
    nameBn: "\u09AC\u09B0\u0997\u09C1\u09A8\u09BE",
    shapeName: "Barguna",
    lat: 22.1523,
    lng: 90.1259,
    prominentDishEn: "Chui Jhal River Fish",
    prominentDishBn: "\u099A\u09C1\u0987\u099D\u09BE\u09B2\u09C7 \u09A8\u09A6\u09C0\u09B0 \u099F\u09BE\u099F\u0995\u09BE \u09AE\u09BE\u099B",
    description: "Coastal river catches simmered in pungent spicy Chui wood and mustard oil."
  },
  {
    id: "patuakhali",
    divisionId: "barishal",
    nameEn: "Patuakhali",
    nameBn: "\u09AA\u099F\u09C1\u09AF\u09BC\u09BE\u0996\u09BE\u09B2\u09C0",
    shapeName: "Patuakhali",
    lat: 22.3596,
    lng: 90.3299,
    prominentDishEn: "Kuakata Seafood & Shutki Paturi",
    prominentDishBn: "\u0995\u09C1\u09AF\u09BC\u09BE\u0995\u09BE\u099F\u09BE\u09B0 \u09B8\u09BE\u09AE\u09C1\u09A6\u09CD\u09B0\u09BF\u0995 \u09AE\u09BE\u099B \u0993 \u09B6\u09C1\u0981\u099F\u0995\u09BF \u09AA\u09BE\u09A4\u09C1\u09B0\u09BF",
    description: "Daughter of the Sea (Kuakata), offering roasted marine fish and banana-leaf wrapped dried fish paturi."
  },
  // Sylhet Division (4)
  {
    id: "sylhet",
    divisionId: "sylhet",
    nameEn: "Sylhet",
    nameBn: "\u09B8\u09BF\u09B2\u09C7\u099F",
    shapeName: "Sylhet",
    lat: 24.8949,
    lng: 91.8687,
    prominentDishEn: "Shatkora Beef & Nunor Pitha",
    prominentDishBn: "\u09B8\u09BE\u09A4\u0995\u09A1\u09BC\u09BE \u0997\u09B0\u09C1\u09B0 \u09AE\u09BE\u0982\u09B8 \u0993 \u09A8\u09C1\u09A8\u09B0 \u09AA\u09BF\u09A0\u09BE",
    description: "Aromatic citrus paradise, world-famous for tangy wild citrus Shatkora beef curry and savory Nunor pitha."
  },
  {
    id: "moulvibazar",
    divisionId: "sylhet",
    nameEn: "Moulvibazar",
    nameBn: "\u09AE\u09CC\u09B2\u09AD\u09C0\u09AC\u09BE\u099C\u09BE\u09B0",
    shapeName: "Maulvibazar",
    lat: 24.4829,
    lng: 91.7774,
    prominentDishEn: "Seven Color Tea & Manipuri Pitha",
    prominentDishBn: "\u09B8\u09BE\u09A4 \u09B0\u0999\u09C7\u09B0 \u099A\u09BE \u0993 \u09AE\u09A3\u09BF\u09AA\u09C1\u09B0\u09BF \u09AA\u09BF\u09A0\u09BE",
    description: "Tea capital Sreemangal, world renowned for the multi-layered Seven-Color Tea and indigenous Manipuri rice pastries."
  },
  {
    id: "sunamganj",
    divisionId: "sylhet",
    nameEn: "Sunamganj",
    nameBn: "\u09B8\u09C1\u09A8\u09BE\u09AE\u0997\u099E\u09CD\u099C",
    shapeName: "Sunamganj",
    lat: 25.0658,
    lng: 91.395,
    prominentDishEn: "Tanguar Haor Fresh Fish Delicacies",
    prominentDishBn: "\u099F\u09BE\u0999\u09CD\u0997\u09C1\u09AF\u09BC\u09BE\u09B0 \u09B9\u09BE\u0993\u09B0\u09C7\u09B0 \u09A4\u09BE\u099C\u09BE \u09AE\u09BE\u099B\u09C7\u09B0 \u09AA\u09A6",
    description: "Vast ecological wetland Tanguar Haor, celebrated for wild Boal, Pabda, and Rui fish curries cooked with indigenous greens."
  },
  {
    id: "habiganj",
    divisionId: "sylhet",
    nameEn: "Habiganj",
    nameBn: "\u09B9\u09AC\u09BF\u0997\u099E\u09CD\u099C",
    shapeName: "Habiganj",
    lat: 24.3749,
    lng: 91.4155,
    prominentDishEn: "Bipul-er Cha & Haor Duck Curry",
    prominentDishBn: "\u09AC\u09BF\u09AA\u09C1\u09B2\u09C7\u09B0 \u099A\u09BE \u0993 \u09B9\u09BE\u0993\u09B0\u09C7\u09B0 \u09B9\u09BE\u0981\u09B8\u09C7\u09B0 \u09AE\u09BE\u0982\u09B8",
    description: "Rolling tea gardens, spiced tea blends, and winter-special Haor duck curry with garlic and black pepper."
  },
  // Rangpur Division (8)
  {
    id: "rangpur",
    divisionId: "rangpur",
    nameEn: "Rangpur",
    nameBn: "\u09B0\u0982\u09AA\u09C1\u09B0",
    shapeName: "Rangpur",
    lat: 25.7439,
    lng: 89.2752,
    prominentDishEn: "Haribhanga Mango Treats & Shidol",
    prominentDishBn: "\u09B9\u09BE\u0981\u09A1\u09BC\u09BF\u09AD\u09BE\u0999\u09BE \u0986\u09AE \u0993 \u09B8\u09BF\u09A6\u09B2 \u09AD\u09B0\u09CD\u09A4\u09BE",
    description: "Home of fibreless juicy Haribhanga mangoes and Northern delicacy Shidol (fermented fish paste with taro)."
  },
  {
    id: "dinajpur",
    divisionId: "rangpur",
    nameEn: "Dinajpur",
    nameBn: "\u09A6\u09BF\u09A8\u09BE\u099C\u09AA\u09C1\u09B0",
    shapeName: "Dinajpur",
    lat: 25.6279,
    lng: 88.6332,
    prominentDishEn: "Kataribhog Rice & Litchi",
    prominentDishBn: "\u0995\u09BE\u099F\u09BE\u09B0\u09BF\u09AD\u09CB\u0997 \u099A\u09BE\u09B2\u09C7\u09B0 \u09AA\u09CB\u09B2\u09BE\u0993 \u0993 \u09AC\u09C7\u09A6\u09BE\u09A8\u09BE \u09B2\u09BF\u099A\u09C1",
    description: "Producers of supreme aromatic Kataribhog grain and succulent sweet Bedana litchis."
  },
  {
    id: "panchagarh",
    divisionId: "rangpur",
    nameEn: "Panchagarh",
    nameBn: "\u09AA\u099E\u09CD\u099A\u0997\u09A1\u09BC",
    shapeName: "Panchagarh",
    lat: 26.3411,
    lng: 88.5541,
    prominentDishEn: "Plainland Tea & Deshi Murgi",
    prominentDishBn: "\u09B8\u09AE\u09A4\u09B2\u09C7\u09B0 \u099A\u09BE \u0993 \u09A6\u09C7\u09B6\u09BF \u09B9\u09BE\u0981\u09B8-\u09AE\u09C1\u09B0\u0997\u09BF",
    description: "Northern tip with Himalayan vista, boasting organic plainland teas and hearty claypot poultry curries."
  },
  {
    id: "thakurgaon",
    divisionId: "rangpur",
    nameEn: "Thakurgaon",
    nameBn: "\u09A0\u09BE\u0995\u09C1\u09B0\u0997\u09BE\u0981\u0993",
    shapeName: "Thakurgaon",
    lat: 26.0337,
    lng: 88.4617,
    prominentDishEn: "Shidol & Sura Pitha",
    prominentDishBn: "\u09B8\u09BF\u09A6\u09B2 \u0993 \u09B8\u09C1\u09B0\u09BE \u09AA\u09BF\u09A0\u09BE",
    description: "Traditional winter cuisine featuring fiery crushed Shidol and tender steamed rice dumplings."
  },
  {
    id: "gaibandha",
    divisionId: "rangpur",
    nameEn: "Gaibandha",
    nameBn: "\u0997\u09BE\u0987\u09AC\u09BE\u09A8\u09CD\u09A7\u09BE",
    shapeName: "Gaibandha",
    lat: 25.3288,
    lng: 89.5408,
    prominentDishEn: "Rasmanjari",
    prominentDishBn: "\u0997\u09BE\u0987\u09AC\u09BE\u09A8\u09CD\u09A7\u09BE\u09B0 \u09B0\u09B8\u09AE\u099E\u09CD\u099C\u09B0\u09C0",
    description: "Legendary regional dessert featuring mini golden chhana globes bathed in reduced cardamom-scented malai."
  },
  {
    id: "kurigram",
    divisionId: "rangpur",
    nameEn: "Kurigram",
    nameBn: "\u0995\u09C1\u09A1\u09BC\u09BF\u0997\u09CD\u09B0\u09BE\u09AE",
    shapeName: "Kurigram",
    lat: 25.8054,
    lng: 89.6362,
    prominentDishEn: "Kheer Chomchom & Char Fish",
    prominentDishBn: "\u0995\u09CD\u09B7\u09C0\u09B0 \u099A\u09AE\u099A\u09AE \u0993 \u099A\u09B0\u09C7\u09B0 \u09AE\u09BE\u099B",
    description: "Brahmaputra river delta treats including thick milk skin sweets and freshly caught char fish."
  },
  {
    id: "lalmonirhat",
    divisionId: "rangpur",
    nameEn: "Lalmonirhat",
    nameBn: "\u09B2\u09BE\u09B2\u09AE\u09A8\u09BF\u09B0\u09B9\u09BE\u099F",
    shapeName: "Lalmonirhat",
    lat: 25.9923,
    lng: 89.2847,
    prominentDishEn: "Shidol Vapa & Teesta Fish",
    prominentDishBn: "\u09B8\u09BF\u09A6\u09B2 \u09AD\u09BE\u09AA\u09BE \u0993 \u09A4\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0 \u09AC\u09C8\u09B0\u09BE\u09B2\u09C0 \u09AE\u09BE\u099B",
    description: "Teesta river delicacies, famous for tiny sparkling Bairali fish and steamed spicy Shidol."
  },
  {
    id: "nilphamari",
    divisionId: "rangpur",
    nameEn: "Nilphamari",
    nameBn: "\u09A8\u09C0\u09B2\u09AB\u09BE\u09AE\u09BE\u09B0\u09C0",
    shapeName: "Nilphamari",
    lat: 25.9318,
    lng: 88.856,
    prominentDishEn: "Saidpur Beef Kebab & Petha",
    prominentDishBn: "\u09B8\u09C8\u09AF\u09BC\u09A6\u09AA\u09C1\u09B0\u09C7\u09B0 \u0997\u09B0\u09C1\u09B0 \u0995\u09BE\u09AC\u09BE\u09AC \u0993 \u09AA\u09C7\u09A0\u09BE \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    description: "Saidpur railway town famous for melt-in-mouth spiced beef seekh kebabs and heritage ash-gourd sweets."
  },
  // Mymensingh Division (4)
  {
    id: "mymensingh",
    divisionId: "mymensingh",
    nameEn: "Mymensingh",
    nameBn: "\u09AE\u09AF\u09BC\u09AE\u09A8\u09B8\u09BF\u0982\u09B9",
    shapeName: "Mymensingh",
    lat: 24.7471,
    lng: 90.4203,
    prominentDishEn: "Muktagachar Monda",
    prominentDishBn: "\u09AE\u09C1\u0995\u09CD\u09A4\u09BE\u0997\u09BE\u099B\u09BE\u09B0 \u09AE\u09A3\u09CD\u09A1\u09BE",
    description: "Two-century-old royal confection created by Gopal Pal in 1824, consisting of pure curd and sugar patted into flat discs."
  },
  {
    id: "jamalpur",
    divisionId: "mymensingh",
    nameEn: "Jamalpur",
    nameBn: "\u099C\u09BE\u09AE\u09BE\u09B2\u09AA\u09C1\u09B0",
    shapeName: "Jamalpur",
    lat: 24.9375,
    lng: 89.9378,
    prominentDishEn: "Milam Morobba & Pitha",
    prominentDishBn: "\u09AE\u09BF\u09B2\u09A8 \u09AE\u09CB\u09B0\u09AC\u09CD\u09AC\u09BE \u0993 \u099C\u09BE\u09AE\u09BE\u09B2\u09AA\u09C1\u09B0\u09C7\u09B0 \u09AA\u09BF\u09A0\u09BE",
    description: "Exquisite needlecraft and sweet preserves (Morobba) prepared with melon, wax gourd, and sugar."
  },
  {
    id: "netrakona",
    divisionId: "mymensingh",
    nameEn: "Netrakona",
    nameBn: "\u09A8\u09C7\u09A4\u09CD\u09B0\u0995\u09CB\u09A3\u09BE",
    shapeName: "Netrakona",
    lat: 24.8709,
    lng: 90.7279,
    prominentDishEn: "Balish Mishti (Goyanath)",
    prominentDishBn: "\u0997\u09AF\u09BC\u09BE\u09A8\u09BE\u09A5\u09C7\u09B0 \u09AC\u09BE\u09B2\u09BF\u09B6 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    description: "Invented by confectioner Goyanath Ghosh over a century ago; giant pillow-shaped sweets soaked in thick cream."
  },
  {
    id: "sherpur",
    divisionId: "mymensingh",
    nameEn: "Sherpur",
    nameBn: "\u09B6\u09C7\u09B0\u09AA\u09C1\u09B0",
    shapeName: "Sherpur",
    lat: 25.0205,
    lng: 90.0153,
    prominentDishEn: "Chhanar Payesh & Tiler Pitha",
    prominentDishBn: "\u099B\u09BE\u09A8\u09BE\u09B0 \u09AA\u09BE\u09AF\u09BC\u09C7\u09B8 \u0993 \u09A4\u09BF\u09B2\u09C7\u09B0 \u09AA\u09BF\u09A0\u09BE",
    description: "Garo hillside foothills district renowned for rich chhana payesh pudding and roasted sesame pithas."
  }
];

// src/data/seedFoods.ts
var SEED_FOODS = [
  // Dhaka
  {
    id: "food_dhaka_kacchi",
    nameEn: "Old Dhaka Kacchi Biryani",
    nameBn: "\u09AA\u09C1\u09B0\u09BE\u09A8 \u09A2\u09BE\u0995\u09BE\u09B0 \u0995\u09BE\u099A\u09CD\u099A\u09BF \u09AC\u09BF\u09B0\u09BF\u09AF\u09BC\u09BE\u09A8\u09BF",
    shortDescription: "Slow-cooked marinated mutton and fragrant chinigura rice infused with saffron, ghee, and potatoes.",
    detailedDescription: "Kacchi Biryani is the crown jewel of Old Dhaka's culinary tradition. Raw spiced mutton is marinated in yogurt, raw papaya paste, and fragrant spices, then layered directly with half-cooked chinigura rice and golden-fried potatoes inside a sealed handi (copper or clay pot) and slow-cooked over smoldering coals (dum). Served alongside crisp shami kebab, boiled egg, and tangy borhani.",
    category: "main_course",
    districtId: "dhaka",
    divisionId: "dhaka",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    originHistory: "Introduced to Bengal during the Mughal Subahdar governance in the 17th century and perfected by hereditary Ustads in Nazira Bazar and Lalbagh.",
    originSource: "Bangla Academy Folk Culinary Heritage Records",
    isPublished: true,
    ingredients: ["Mutton", "Chinigura Rice", "Ghee", "Saffron", "Potato", "Yogurt", "Cardamom", "Cinnamon", "Mace"],
    approximatePriceBdt: 320,
    dietaryType: "non-veg",
    createdAt: "2025-01-15T08:00:00.000Z",
    updatedAt: "2025-01-15T08:00:00.000Z"
  },
  {
    id: "food_dhaka_bakarkhani",
    nameEn: "Dhakaiya Bakarkhani",
    nameBn: "\u09A2\u09BE\u0995\u09BE\u0987\u09AF\u09BC\u09BE \u09AC\u09BE\u0995\u09B0\u0996\u09BE\u09A8\u09BF",
    shortDescription: "Crisp, multi-layered flaky round flatbread with subtle sesame and ghee aroma.",
    detailedDescription: "Bakarkhani is a crisp, layered flatbread prepared in traditional clay tandoors across Chawkbazar and Lalbagh. The dough is rolled repeatedly with layers of ghee or dalda and flour, dusted with nigella or sesame seeds, and baked on the inner walls of the tandoor. It is commonly enjoyed for breakfast dipped in spiced milk tea or alongside sweet semolina halwa.",
    category: "snacks",
    districtId: "dhaka",
    divisionId: "dhaka",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    originHistory: "Associated with the tragic romance between general Aga Baker and dancer Khani Begum during the Nawab era of Dhaka.",
    originSource: "Dacca: A Record of its Changing Fortunes (A.H. Dani)",
    isPublished: true,
    ingredients: ["Flour", "Ghee", "Sesame Seeds", "Water", "Salt"],
    approximatePriceBdt: 15,
    dietaryType: "veg",
    createdAt: "2025-01-15T08:00:00.000Z",
    updatedAt: "2025-01-15T08:00:00.000Z"
  },
  {
    id: "food_dhaka_morog_polao",
    nameEn: "Shahi Morog Polao",
    nameBn: "\u09B6\u09BE\u09B9\u09C0 \u09AE\u09CB\u09B0\u0997 \u09AA\u09CB\u09B2\u09BE\u0993",
    shortDescription: "Tender desi chicken drumsticks gently braised in yogurt, aromatic ghee, and Kalijira rice.",
    detailedDescription: "Shahi Morog Polao features aromatic Kalijira aromatic rice, rich cow milk ghee, sour yogurt, and golden roasted onions (beresta) gently infused with whole green chillies and roasted chicken. Famous heritage shops like Nanna Biryani have served this dish for decades.",
    category: "main_course",
    districtId: "dhaka",
    divisionId: "dhaka",
    imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80",
    originHistory: "Royal Dacca household banquets during British and Mughal administrations.",
    originSource: "Old Dhaka Heritage Trust",
    isPublished: true,
    ingredients: ["Desi Chicken", "Kalijira Rice", "Ghee", "Beresta", "Sour Curd", "Green Chili", "Raisins"],
    approximatePriceBdt: 260,
    dietaryType: "non-veg",
    createdAt: "2025-01-16T08:00:00.000Z",
    updatedAt: "2025-01-16T08:00:00.000Z"
  },
  // Tangail
  {
    id: "food_tangail_chomchom",
    nameEn: "Porabari Chomchom",
    nameBn: "\u09AA\u09CB\u09A1\u09BC\u09BE\u09AC\u09BE\u09A1\u09BC\u09BF\u09B0 \u099A\u09AE\u099A\u09AE",
    shortDescription: "The king of sweets: caramel-toned spongy chhana cylinders rolled in delicate mawa crumbs.",
    detailedDescription: "Originating from the village of Porabari beside the Dhaleshwari river in Tangail, this sweet has an unmistakable reddish-brown outer crust, a tender honeycomb spongy center soaked in thickened cardamom sugar syrup, and a generous coating of grated dry mawa.",
    category: "sweets_pitha",
    districtId: "tangail",
    divisionId: "dhaka",
    imageUrl: "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80",
    originHistory: "Pioneered in the mid-19th century by master sweetmaker Dasharath Gour using sweet water from the Dhaleshwari river.",
    originSource: "Tangail District Gazetteer",
    isPublished: true,
    ingredients: ["Fresh Chhana", "Sugar", "Mawa", "Cardamom", "Water"],
    approximatePriceBdt: 450,
    dietaryType: "sweet",
    createdAt: "2025-01-16T08:00:00.000Z",
    updatedAt: "2025-01-16T08:00:00.000Z"
  },
  // Chattogram
  {
    id: "food_ctg_kala_bhuna",
    nameEn: "Chattogram Kala Bhuna",
    nameBn: "\u099A\u099F\u09CD\u099F\u0997\u09CD\u09B0\u09BE\u09AE\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0995\u09BE\u09B2\u09BE \u09AD\u09C1\u09A8\u09BE",
    shortDescription: "Intensely caramelized slow-roasted spicy black beef packed with aromatic spices.",
    detailedDescription: "Kala Bhuna is prepared by searing and slow-cooking prime cuts of beef with fried onions, mustard oil, black cardamom, star anise, radhuni, and crushed peppercorns until the meat juices evaporate and the spices cling to the meat as a deep ebony-black glaze without burning. The texture is crispy outside yet supremely tender and juicy inside.",
    category: "main_course",
    districtId: "chattogram",
    divisionId: "chattogram",
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    originHistory: "Developed through indigenous slow-cooking methods in Chittagong port kitchens and family feasts.",
    originSource: "Chittagong Cultural Heritage Foundation",
    isPublished: true,
    ingredients: ["Beef", "Mustard Oil", "Fried Onions", "Black Cardamom", "Radhuni", "Cinnamon", "Black Pepper", "Garlic"],
    approximatePriceBdt: 380,
    dietaryType: "non-veg",
    createdAt: "2025-01-16T08:00:00.000Z",
    updatedAt: "2025-01-16T08:00:00.000Z"
  },
  {
    id: "food_ctg_mezban",
    nameEn: "Mezban Gosht & Dal",
    nameBn: "\u09AE\u09C7\u099C\u09AC\u09BE\u09A8\u09BF \u0997\u09CB\u09B6\u09A4 \u0993 \u099A\u09A8\u09BE\u09B0 \u09A1\u09BE\u09B2",
    shortDescription: "Spicy, fiery communal beef curry prepared with special Mezban masala blend and chana dal.",
    detailedDescription: "Mezban is an age-old Chittagonian socio-cultural tradition of hosting grand community feasts. The beef is stewed in huge iron cauldrons (dekchi) over open firewood flames, flavoured with a distinct aromatic masala consisting of nutmeg, mace, fennel, and white mustard seeds. Served along with steaming white rice and aromatic split Bengal gram (Chana Dal).",
    category: "traditional",
    districtId: "chattogram",
    divisionId: "chattogram",
    imageUrl: "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=800&q=80",
    originHistory: "Dating back hundreds of years as a customary feast commemorating momentous community and religious occasions.",
    originSource: "Port City Folklore & Cultural Society",
    isPublished: true,
    ingredients: ["Beef", "White Mustard", "Fennel", "Mace", "Nutmeg", "Mustard Oil", "Chana Dal"],
    approximatePriceBdt: 350,
    dietaryType: "non-veg",
    createdAt: "2025-01-17T08:00:00.000Z",
    updatedAt: "2025-01-17T08:00:00.000Z"
  },
  // Cumilla
  {
    id: "food_cumilla_rasmalai",
    nameEn: "Cumilla Matri Bhander Rasmalai",
    nameBn: "\u0995\u09C1\u09AE\u09BF\u09B2\u09CD\u09B2\u09BE\u09B0 \u09AE\u09BE\u09A4\u09C3\u09AD\u09BE\u09A3\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u09B0\u09B8\u09AE\u09BE\u09B2\u09BE\u0987",
    shortDescription: "Bite-sized velvety chhana pillows steeped in rich, cardamom-scented clotted condensed milk.",
    detailedDescription: "Matri Bhander of Manoharpur, Cumilla, established in 1906, is the gold standard for Rasmalai. Unlike larger versions elsewhere, authentic Cumilla Rasmalai features bite-sized mini rasgullas simmered for hours in sweetened milk until it reduces to half its volume into an indulgent, velvety malai (clotted cream).",
    category: "sweets_pitha",
    districtId: "cumilla",
    divisionId: "chattogram",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    originHistory: "Created by brothers Khanindra Sen and Manindra Sen in 1906 at Manoharpur in Cumilla town.",
    originSource: "Cumilla District Administration Cultural Archives",
    isPublished: true,
    ingredients: ["Fresh Chhana", "Pure Cow Milk", "Sugar", "Cardamom", "Saffron"],
    approximatePriceBdt: 320,
    dietaryType: "sweet",
    createdAt: "2025-01-17T08:00:00.000Z",
    updatedAt: "2025-01-17T08:00:00.000Z"
  },
  // Bogura
  {
    id: "food_bogura_doi",
    nameEn: "Bogurar Mishti Doi",
    nameBn: "\u09AC\u0997\u09C1\u09A1\u09BC\u09BE\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09A6\u0987",
    shortDescription: "GI-tagged caramelized red sweet curd fermented to creamy perfection in earthenware pots.",
    detailedDescription: "Bogura Mishti Doi is an iconic Bangladeshi dessert recognized with Geographical Indication (GI) status. Full-fat cow milk is boiled with sugar and reduced until it takes on a warm golden caramel tint. It is poured into unglazed porous earthenware cups (shorap/shanki), seeded with a culture, and wrapped overnight. The porous clay absorbs extra water, resulting in a thick, velvety curd.",
    category: "dessert",
    districtId: "bogura",
    divisionId: "rajshahi",
    imageUrl: "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=800&q=80",
    originHistory: "Introduced by the Ghosh family of Sherpur in Bogura during the early 19th century, later popularized by Gour Gopal Ghosh in Gauripara.",
    originSource: "Department of Patents, Designs and Trademarks (GI Registry)",
    isPublished: true,
    ingredients: ["Pure Cow Milk", "Caramelized Sugar", "Natural Curd Culture"],
    approximatePriceBdt: 240,
    dietaryType: "sweet",
    createdAt: "2025-01-17T08:00:00.000Z",
    updatedAt: "2025-01-17T08:00:00.000Z"
  },
  // Rajshahi
  {
    id: "food_rajshahi_kalai_ruti",
    nameEn: "Rajshahi Kalai Ruti & Begun Bhorta",
    nameBn: "\u09B0\u09BE\u099C\u09B6\u09BE\u09B9\u09C0\u09B0 \u0995\u09BE\u09B2\u09BE\u0987 \u09B0\u09C1\u099F\u09BF \u0993 \u09AC\u09C7\u0997\u09C1\u09A8 \u09AD\u09B0\u09CD\u09A4\u09BE",
    shortDescription: "Rustic pan-toasted black gram flatbread served with fiery green chili and smoked eggplant mash.",
    detailedDescription: "Kalai Ruti is a traditional flatbread native to Rajshahi and Chapai Nawabganj made from a blend of mashkalai (black gram flour) and atap rice flour. Expert makers pat the dough entirely with bare hands over a curved clay skillet (tawa) without a rolling pin. Served piping hot with smoked eggplant mash (begun bhorta), green chili onion paste, and mustard oil.",
    category: "traditional",
    districtId: "rajshahi",
    divisionId: "rajshahi",
    imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
    originHistory: "Traditional winter staple of agrarian communities across the Barind tract.",
    originSource: "Barind Heritage Society, Rajshahi",
    isPublished: true,
    ingredients: ["Black Gram Flour (Mashkalai)", "Atap Rice Flour", "Smoked Eggplant", "Green Chili", "Mustard Oil"],
    approximatePriceBdt: 50,
    dietaryType: "veg",
    createdAt: "2025-01-18T08:00:00.000Z",
    updatedAt: "2025-01-18T08:00:00.000Z"
  },
  // Natore
  {
    id: "food_natore_kachagolla",
    nameEn: "Natorer Kachagolla",
    nameBn: "\u09A8\u09BE\u099F\u09CB\u09B0\u09C7\u09B0 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u0995\u09BE\u0981\u099A\u09BE\u0997\u09CB\u09B2\u09CD\u09B2\u09BE",
    shortDescription: "Pure soft chhana crumbs tossed in fragrant sugar syrup, wrapped in dried milk skin.",
    detailedDescription: "Unlike rounded sweets, Kachagolla is soft, granular, melt-in-the-mouth sweetened fresh chhana. It was accidentally created when a confectioner had leftover unsold milk curd and tossed it into boiling sugar syrup to prevent spoiling. The resulting lightly sweetened confection earned immediate royal acclaim from Rani Bhabani of Natore Rajbari.",
    category: "sweets_pitha",
    districtId: "natore",
    divisionId: "rajshahi",
    imageUrl: "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80",
    originHistory: "Accidentally invented around 1760 in Madhusudan Pal's sweet shop during the reign of Rani Bhabani.",
    originSource: "Natore Rajbari Historical Chronicle",
    isPublished: true,
    ingredients: ["Fresh Chhana", "Sugar", "Cardamom", "Mawa"],
    approximatePriceBdt: 420,
    dietaryType: "sweet",
    createdAt: "2025-01-18T08:00:00.000Z",
    updatedAt: "2025-01-18T08:00:00.000Z"
  },
  // Khulna
  {
    id: "food_khulna_chui_jhal",
    nameEn: "Khulna Chui Jhal Khasir Mangsho",
    nameBn: "\u0996\u09C1\u09B2\u09A8\u09BE\u09B0 \u099A\u09C1\u0987\u099D\u09BE\u09B2 \u0996\u09BE\u09B8\u09BF\u09B0 \u09AE\u09BE\u0982\u09B8",
    shortDescription: "Signature southern delicacy with tender mutton braised with pungent piper chaba woody vine.",
    detailedDescription: "Chui Jhal (Piper chaba) is a climbing herbal vine native to the southern delta. The thick woody stem is sliced into small sticks and simmered slowly with mutton, whole garlic bulbs, and mustard oil. The wood releases a spicy, numbing warmth, distinct from black pepper and chili, rendering the mutton fragrant and succulent.",
    category: "main_course",
    districtId: "khulna",
    divisionId: "khulna",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    originHistory: "Indigenous spice tradition of the lower Gangetic basin, popularized by Chuknagar and Abbas Hotel in Khulna.",
    originSource: "Khulna Cultural Heritage Society",
    isPublished: true,
    ingredients: ["Mutton", "Chui Jhal Stem", "Whole Garlic", "Mustard Oil", "Ginger", "Onion", "Spices"],
    approximatePriceBdt: 400,
    dietaryType: "non-veg",
    createdAt: "2025-01-18T08:00:00.000Z",
    updatedAt: "2025-01-18T08:00:00.000Z"
  },
  // Kushtia
  {
    id: "food_kushtia_tiler_khaja",
    nameEn: "Kushtia Tiler Khaja",
    nameBn: "\u0995\u09C1\u09B7\u09CD\u099F\u09BF\u09AF\u09BC\u09BE\u09B0 \u09A4\u09BF\u09B2\u09C7\u09B0 \u0996\u09BE\u099C\u09BE",
    shortDescription: "Wafer-thin crisp sesame seed brittle with delicate airy honeycomb layers.",
    detailedDescription: "Tiler Khaja is a light, crunchy sweet made by boiling sugar and cardamom into a thick candy, pulling and folding the aerated candy into ribbons, and coating with toasted white sesame seeds. It snaps crisply with every bite.",
    category: "snacks",
    districtId: "kushtia",
    divisionId: "khulna",
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80",
    originHistory: "Originated in Kushtia town during the British era by sweetmaker families of Mohini Mills quarter.",
    originSource: "Kushtia District Portal Documentation",
    isPublished: true,
    ingredients: ["Sugar", "White Sesame Seeds", "Cardamom", "Water"],
    approximatePriceBdt: 180,
    dietaryType: "sweet",
    createdAt: "2025-01-19T08:00:00.000Z",
    updatedAt: "2025-01-19T08:00:00.000Z"
  },
  // Sylhet
  {
    id: "food_sylhet_shatkora",
    nameEn: "Sylhet Shatkora Beef Curry",
    nameBn: "\u09B8\u09BF\u09B2\u09C7\u099F\u09C7\u09B0 \u09B8\u09BE\u09A4\u0995\u09A1\u09BC\u09BE \u09A6\u09BF\u09AF\u09BC\u09C7 \u0997\u09B0\u09C1\u09B0 \u09AE\u09BE\u0982\u09B8",
    shortDescription: "Tender beef curry infused with the aromatic, tangy rind of wild mountain citrus Shatkora.",
    detailedDescription: "Shatkora (Citrus macroptera) is a semi-wild citrus fruit native to the forested hills of Sylhet and Assam. Thick slices of the fruit's aromatic peel are cooked into beef or mutton gravy. The natural bitter-sour oils impart a fragrant citrus aroma and robust tang that cuts through the richness of the meat.",
    category: "traditional",
    districtId: "sylhet",
    divisionId: "sylhet",
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    originHistory: "Centuries-old tribal and Bengali hill culinary integration in the Surma and Kushiyara river valleys.",
    originSource: "Sylhet Division Folk Heritage Register",
    isPublished: true,
    ingredients: ["Beef", "Fresh Shatkora Peel", "Mustard Oil", "Garlic", "Cumin", "Turmeric", "Green Chillies"],
    approximatePriceBdt: 360,
    dietaryType: "non-veg",
    createdAt: "2025-01-19T08:00:00.000Z",
    updatedAt: "2025-01-19T08:00:00.000Z"
  },
  // Moulvibazar
  {
    id: "food_moulvibazar_seven_tea",
    nameEn: "Sreemangal Seven Layer Tea",
    nameBn: "\u09B6\u09CD\u09B0\u09C0\u09AE\u0999\u09CD\u0997\u09B2\u09C7\u09B0 \u09B8\u09BE\u09A4 \u09B0\u0999\u09C7\u09B0 \u099A\u09BE",
    shortDescription: "World-famous multi-colored tea glass exhibiting distinct layers of black, green, and milk brews.",
    detailedDescription: "Invented in Sreemangal by Romesh Ram Gour at Nilkantha Tea Cabin, this beverage features up to seven distinct horizontal colored layers in a single clear glass. Each layer has varying densities, tea extracts, milk concentrations, and spice balances that stay separated as you sip.",
    category: "drinks",
    districtId: "moulvibazar",
    divisionId: "sylhet",
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
    originHistory: "Invented by Romesh Ram Gour at Nilkantha Tea Cabin in 2002.",
    originSource: "Bangladesh Tea Board & National Tourism Documentation",
    isPublished: true,
    ingredients: ["Black Tea", "Green Tea", "Condensed Milk", "Lemon Extract", "Cloves", "Cinnamon"],
    approximatePriceBdt: 80,
    dietaryType: "veg",
    createdAt: "2025-01-19T08:00:00.000Z",
    updatedAt: "2025-01-19T08:00:00.000Z"
  },
  // Chandpur
  {
    id: "food_chandpur_ilish",
    nameEn: "Chandpuri Ilish Paturi & Macher Jhol",
    nameBn: "\u099A\u09BE\u0981\u09A6\u09AA\u09C1\u09B0\u09C7\u09B0 \u09B0\u09C2\u09AA\u09BE\u09B2\u09BF \u0987\u09B2\u09BF\u09B6 \u09AA\u09BE\u09A4\u09C1\u09B0\u09BF \u0993 \u099D\u09CB\u09B2",
    shortDescription: "Steamed Hilsa steaks coated in ground mustard and green chilies wrapped in charred banana leaves.",
    detailedDescription: "Chandpur is the national hub where the Padma and Meghna rivers converge, yielding the prized oily, sweet silver Hilsa. In Paturi, thick fillets are marinated in cold-pressed mustard oil, ground black and yellow mustard seeds, green chilies, and turmeric, wrapped in banana leaves, and pan-roasted on low flame until tender and smoky.",
    category: "traditional",
    districtId: "chandpur",
    divisionId: "chattogram",
    imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
    originHistory: "Heritage riverine delicacy of the Meghna delta fishermen communities.",
    originSource: "Fisheries Research Institute, Chandpur",
    isPublished: true,
    ingredients: ["Padma Hilsa Fish", "Shorshe (Mustard Paste)", "Mustard Oil", "Green Chili", "Banana Leaves"],
    approximatePriceBdt: 450,
    dietaryType: "non-veg",
    createdAt: "2025-01-20T08:00:00.000Z",
    updatedAt: "2025-01-20T08:00:00.000Z"
  },
  // Mymensingh
  {
    id: "food_mymensingh_monda",
    nameEn: "Muktagachar Monda",
    nameBn: "\u09AE\u09C1\u0995\u09CD\u09A4\u09BE\u0997\u09BE\u099B\u09BE\u09B0 \u09B0\u09BE\u099C\u0995\u09C0\u09AF\u09BC \u09AE\u09A3\u09CD\u09A1\u09BE",
    shortDescription: "Two-century-old royal confection of pure chhana discs patted on parchment paper.",
    detailedDescription: "Muktagachar Monda dates back to 1824 when Gopal Pal presented it to Maharaja Suryakanta Acharya Chowdhury. It is prepared using only pure unpasteurized cow chhana and unrefined sugar cooked over low heat, hand-flattened into thick discs, and preserved on paper. It contains no artificial flavors or preservatives.",
    category: "sweets_pitha",
    districtId: "mymensingh",
    divisionId: "mymensingh",
    imageUrl: "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80",
    originHistory: "Invented in 1824 by Ram Gopal Pal under the patronage of the Muktagacha Zamindars.",
    originSource: "Mymensingh Zamindar History Archives",
    isPublished: true,
    ingredients: ["Pure Chhana", "Sugar", "Cardamom"],
    approximatePriceBdt: 480,
    dietaryType: "sweet",
    createdAt: "2025-01-20T08:00:00.000Z",
    updatedAt: "2025-01-20T08:00:00.000Z"
  },
  // Netrakona
  {
    id: "food_netrakona_balish",
    nameEn: "Goyanath-er Balish Mishti",
    nameBn: "\u09A8\u09C7\u09A4\u09CD\u09B0\u0995\u09CB\u09A3\u09BE\u09B0 \u0997\u09AF\u09BC\u09BE\u09A8\u09BE\u09A5\u09C7\u09B0 \u09AC\u09BE\u09B2\u09BF\u09B6 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    shortDescription: "Pillow-sized jumbo spongy mishti soaked in condensed cardamom malai.",
    detailedDescription: 'Balish (literally "pillow") Mishti was conceptualized by sweetmaker Goyanath Ghosh of Netrakona in the early 20th century. Sized from standard to grand pillow shapes, the sweet is made of kneaded chhana, boiled in syrup, and coated in thick, reduced malai before serving.',
    category: "sweets_pitha",
    districtId: "netrakona",
    divisionId: "mymensingh",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    originHistory: "Crafted by master sweetmaker Goyanath Ghosh around 1900 in Netrakona town.",
    originSource: "Netrakona District Literary Forum",
    isPublished: true,
    ingredients: ["Chhana", "Sugar Syrup", "Reduced Malai", "Mawa", "Cardamom"],
    approximatePriceBdt: 120,
    dietaryType: "sweet",
    createdAt: "2025-01-20T08:00:00.000Z",
    updatedAt: "2025-01-20T08:00:00.000Z"
  },
  // Barishal
  {
    id: "food_barishal_balam_rice_ilish",
    nameEn: "Barishali Ilish Bhapa & Balam Rice",
    nameBn: "\u09AC\u09B0\u09BF\u09B6\u09BE\u09B2\u09C7\u09B0 \u0987\u09B2\u09BF\u09B6 \u09AD\u09BE\u09AA\u09BE \u0993 \u09AC\u09BE\u09B2\u09BE\u09AE \u099A\u09BE\u09B2",
    shortDescription: "Steamed Hilsa in mustard yogurt sauce over heirloom aromatic Balam rice.",
    detailedDescription: "Barishal, known as the granary of Bengal, is famous for its heirloom Balam rice, an aromatic medium grain. In Ilish Bhapa, fresh river hilsa is coated with pungent stone-ground mustard paste, mustard oil, sour curd, and slit green chilies, steamed in a sealed tiffin box.",
    category: "traditional",
    districtId: "barishal",
    divisionId: "barishal",
    imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
    originHistory: "Traditional riverside cooking practice of southern river deltas.",
    originSource: "Barishal District Gazetteer",
    isPublished: true,
    ingredients: ["Hilsa Fish", "Balam Rice", "Shorshe Bata", "Mustard Oil", "Green Chili", "Sour Curd"],
    approximatePriceBdt: 360,
    dietaryType: "non-veg",
    createdAt: "2025-01-21T08:00:00.000Z",
    updatedAt: "2025-01-21T08:00:00.000Z"
  },
  // Bhola
  {
    id: "food_bhola_buffalo_curd",
    nameEn: "Bhola Buffalo Milk Curd (Moyish-er Doi)",
    nameBn: "\u09AD\u09CB\u09B2\u09BE\u09B0 \u09AE\u09B9\u09BF\u09B7\u09C7\u09B0 \u0995\u09BE\u0981\u099A\u09BE \u09A6\u09C1\u09A7\u09C7\u09B0 \u09A6\u0987",
    shortDescription: "Dense, naturally set organic buffalo curd served with fresh date palm syrup.",
    detailedDescription: "Bhola island in the Bay of Bengal estuary is home to thousands of free-range buffaloes grazing on the coastal sandbars (chars). Raw buffalo milk has higher fat and solids, so it sets naturally into an ultra-thick, creamy white curd in clay pots without any artificial thickeners. Best enjoyed with winter date palm liquid jaggery.",
    category: "dessert",
    districtId: "bhola",
    divisionId: "barishal",
    imageUrl: "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=800&q=80",
    originHistory: "Centuries of indigenous pastoral farming in the Meghna estuary chars.",
    originSource: "Coastal Island Heritage Study, Bhola",
    isPublished: true,
    ingredients: ["Raw Buffalo Milk", "Natural Curd Culture", "Liquid Date Molasses"],
    approximatePriceBdt: 200,
    dietaryType: "sweet",
    createdAt: "2025-01-21T08:00:00.000Z",
    updatedAt: "2025-01-21T08:00:00.000Z"
  },
  // Rangpur
  {
    id: "food_rangpur_shidol",
    nameEn: "Rangpuri Shidol Bhorta",
    nameBn: "\u09B0\u0982\u09AA\u09C1\u09B0\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09B8\u09BF\u09A6\u09B2 \u09AD\u09B0\u09CD\u09A4\u09BE",
    shortDescription: "Spicy fermented fish paste mashed with taro stems, garlic, and dried red chilies.",
    detailedDescription: "Shidol is an indigenous fermented fish preparation crafted across northern Bangladesh. Tiny mola or punti fish are cleaned, dried in the sun, blended with mashed taro stem (kochu) and turmeric, shaped into cakes, and sun-dried and fermented in earthen pots. Roasted and mashed with fiery red chili and mustard oil.",
    category: "traditional",
    districtId: "rangpur",
    divisionId: "rangpur",
    imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
    originHistory: "Ancient preservation method developed by rural communities of North Bengal.",
    originSource: "North Bengal Folk Archive",
    isPublished: true,
    ingredients: ["Fermented Small Fish (Punti)", "Taro Stem", "Garlic", "Dry Red Chili", "Mustard Oil"],
    approximatePriceBdt: 40,
    dietaryType: "non-veg",
    createdAt: "2025-01-22T08:00:00.000Z",
    updatedAt: "2025-01-22T08:00:00.000Z"
  },
  // Dinajpur
  {
    id: "food_dinajpur_kataribhog",
    nameEn: "Dinajpur Kataribhog Polao",
    nameBn: "\u09A6\u09BF\u09A8\u09BE\u099C\u09AA\u09C1\u09B0\u09C7\u09B0 \u0995\u09BE\u099F\u09BE\u09B0\u09BF\u09AD\u09CB\u0997 \u099A\u09BE\u09B2\u09C7\u09B0 \u09B8\u09C1\u0997\u09A8\u09CD\u09A7\u09BF \u09AA\u09CB\u09B2\u09BE\u0993",
    shortDescription: "Aromatic long-grain heirloom rice cooked with golden fried shallots and ghee.",
    detailedDescription: "Kataribhog rice from Dinajpur has a distinct dagger-curved tip (Katari) and an irresistible floral aroma. Prepared into a royal white polao infused with clarified butter, whole cardamom, bay leaf, and roasted cashews.",
    category: "main_course",
    districtId: "dinajpur",
    divisionId: "rangpur",
    imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80",
    originHistory: "Harvested in the fertile red soils of Dinajpur for royal households of Bengal.",
    originSource: "Dinajpur Agriculture Chronicle",
    isPublished: true,
    ingredients: ["Kataribhog Rice", "Ghee", "Shallots", "Cardamom", "Bay Leaves", "Cashews"],
    approximatePriceBdt: 180,
    dietaryType: "veg",
    createdAt: "2025-01-22T08:00:00.000Z",
    updatedAt: "2025-01-22T08:00:00.000Z"
  },
  // Brahmanbaria
  {
    id: "food_brahmanbaria_chanar_mukhi",
    nameEn: "Brahmanbaria Chanar Mukhi",
    nameBn: "\u09AC\u09CD\u09B0\u09BE\u09B9\u09CD\u09AE\u09A3\u09AC\u09BE\u09A1\u09BC\u09BF\u09AF\u09BC\u09BE\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u099B\u09BE\u09A8\u09BE\u09B0 \u09AE\u09C1\u0996\u09C0",
    shortDescription: "GI-certified bite-sized crisp sugar-frosted sweet curd diamonds.",
    detailedDescription: "Chanar Mukhi is prepared by pressing fresh chhana into firm blocks, cutting them into tiny cubic or diamond dice, boiling them in clear sugar syrup, and tossing until a crunchy white sugary crust crystallizes over each piece. Recognized as a Geographical Indication (GI) product of Bangladesh.",
    category: "sweets_pitha",
    districtId: "brahmanbaria",
    divisionId: "chattogram",
    imageUrl: "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80",
    originHistory: "Originated in the late 19th century by master sweetmaker Kashiram Das in Brahmanbaria town.",
    originSource: "Geographical Indication Journal of Bangladesh",
    isPublished: true,
    ingredients: ["Fresh Chhana", "Sugar", "Pure Cow Ghee", "Cardamom"],
    approximatePriceBdt: 600,
    dietaryType: "sweet",
    createdAt: "2025-01-23T08:00:00.000Z",
    updatedAt: "2025-01-23T08:00:00.000Z"
  },
  // Cox's Bazar
  {
    id: "food_coxsbazar_shutki",
    nameEn: "Cox's Bazar Chhuri Shutki Bhorta",
    nameBn: "\u0995\u0995\u09CD\u09B8\u09AC\u09BE\u099C\u09BE\u09B0\u09C7\u09B0 \u099B\u09C1\u09B0\u09BF \u09B6\u09C1\u0981\u099F\u0995\u09BF \u09AD\u09B0\u09CD\u09A4\u09BE",
    shortDescription: "Spicy sun-cured ribbon fish mashed with charred onions, garlic, and fiery Naga chillies.",
    detailedDescription: "Sun-dried ribbon fish (Chhuri Shutki) caught off the Bay of Bengal coastline, roasted on dry charcoal grates to intensify umami, shredded, and pounded in stone mortars with roasted whole garlic, red onions, and hot mustard oil.",
    category: "street_food",
    districtId: "coxs_bazar",
    divisionId: "chattogram",
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    originHistory: "Coastal fishermen culinary culture of Nazirtek, the largest shutki drying yard in Asia.",
    originSource: "Cox's Bazar Marine Resources Society",
    isPublished: true,
    ingredients: ["Chhuri Shutki (Ribbon Fish)", "Onion", "Garlic", "Green Chilli", "Mustard Oil"],
    approximatePriceBdt: 120,
    dietaryType: "non-veg",
    createdAt: "2025-01-23T08:00:00.000Z",
    updatedAt: "2025-01-23T08:00:00.000Z"
  },
  // Bandarban
  {
    id: "food_bandarban_bamboo_chicken",
    nameEn: "Bandarban Bamboo Chicken",
    nameBn: "\u09AC\u09BE\u09A8\u09CD\u09A6\u09B0\u09AC\u09BE\u09A8\u09C7\u09B0 \u09AC\u09BE\u0981\u09B6 \u09AE\u09C1\u09B0\u0997\u09BF",
    shortDescription: "Country chicken marinated in mountain ginger and wrapped in wild bamboo cooked over coals.",
    detailedDescription: "An indigenous culinary masterpiece from the Hill Tracts. Free-range chicken is marinated with mountain turmeric, wild ginger, bird's eye chili, and hill spices, packed into green bamboo hollows, sealed with banana leaves, and cooked slowly over wood embers.",
    category: "traditional",
    districtId: "bandarban",
    divisionId: "chattogram",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    originHistory: "Traditional forest and jungle survival cooking of Marma and Bawm indigenous communities.",
    originSource: "Bandarban Indigenous Cultural Center",
    isPublished: true,
    ingredients: ["Desi Country Chicken", "Wild Ginger", "Green Bamboo Stalk", "Banana Leaves", "Hill Chilies"],
    approximatePriceBdt: 420,
    dietaryType: "non-veg",
    createdAt: "2025-01-24T08:00:00.000Z",
    updatedAt: "2025-01-24T08:00:00.000Z"
  },
  // Jashore
  {
    id: "food_jashore_jamtola",
    nameEn: "Jashore Jamtolar Mishti",
    nameBn: "\u09AF\u09B6\u09CB\u09B0\u09C7\u09B0 \u099C\u09BE\u09AE\u09A4\u09B2\u09BE\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    shortDescription: "Century-old juicy syrup-soaked sweet with velvety smooth chhana texture.",
    detailedDescription: "Crafted since 1955 under the shade of a jam (blackberry) tree at Jamtola bazaar by SK Sadhu Ghosh. Prepared from pure cow milk and soaked in mild, fragrant sugar syrup that melts in the mouth.",
    category: "sweets_pitha",
    districtId: "jashore",
    divisionId: "khulna",
    imageUrl: "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80",
    originHistory: "Founded in 1955 by sweetmaker SK Sadhu Ghosh in Jamtola bazaar.",
    originSource: "Jashore Folk Culture Institute",
    isPublished: true,
    ingredients: ["Fresh Chhana", "Sugar Syrup", "Cardamom", "Milk Cream"],
    approximatePriceBdt: 280,
    dietaryType: "sweet",
    createdAt: "2025-01-24T08:00:00.000Z",
    updatedAt: "2025-01-24T08:00:00.000Z"
  },
  // Gaibandha
  {
    id: "food_gaibandha_rasmanjari",
    nameEn: "Gaibandha Rasmanjari",
    nameBn: "\u0997\u09BE\u0987\u09AC\u09BE\u09A8\u09CD\u09A7\u09BE\u09B0 \u09B0\u09B8\u09AE\u099E\u09CD\u099C\u09B0\u09C0",
    shortDescription: "Golden chhana balls swimming in rich, creamy reduced milk with saffron highlights.",
    detailedDescription: "Rasmanjari of Gaibandha was established in 1948 by Ramesh Chandra Ghosh. Small, perfectly rounded chhana globes are fried lightly or poached in sugar syrup and steeped in thickened milk reduced slowly over firewood.",
    category: "sweets_pitha",
    districtId: "gaibandha",
    divisionId: "rangpur",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    originHistory: "Pioneered in 1948 by Ramesh Chandra Ghosh of Gaibandha.",
    originSource: "Gaibandha District Press Club Journal",
    isPublished: true,
    ingredients: ["Chhana", "Condensed Milk", "Sugar", "Saffron", "Cardamom"],
    approximatePriceBdt: 340,
    dietaryType: "sweet",
    createdAt: "2025-01-25T08:00:00.000Z",
    updatedAt: "2025-01-25T08:00:00.000Z"
  },
  // Sirajganj
  {
    id: "food_sirajganj_ponir",
    nameEn: "Sirajganj Artisanal Ponir (Cheese)",
    nameBn: "\u09B8\u09BF\u09B0\u09BE\u099C\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u09A6\u09C1\u09A7\u09C7\u09B0 \u09AA\u09A8\u09BF\u09B0",
    shortDescription: "Naturally aged pure cow milk cheese wheels with mild savory aroma.",
    detailedDescription: "Sirajganj, situated in the milk-rich Chalan Beel catchment area, is the historical cradle of Bangladeshi artisanal cheese (Ponir). Made by curdling fresh cow milk, pressing whey through muslin cloths into wooden molds, and salting to cure naturally.",
    category: "traditional",
    districtId: "sirajganj",
    divisionId: "rajshahi",
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80",
    originHistory: "Introduced by Portuguese settlers in Bengal during the 16th century and naturalized by local Ghopa communities.",
    originSource: "Sirajganj Agricultural & Dairy Heritage",
    isPublished: true,
    ingredients: ["Whole Cow Milk", "Natural Rennet/Citric Curd", "Salt"],
    approximatePriceBdt: 750,
    dietaryType: "veg",
    createdAt: "2025-01-25T08:00:00.000Z",
    updatedAt: "2025-01-25T08:00:00.000Z"
  },
  // Shariatpur
  {
    id: "food_shariatpur_bibikhana",
    nameEn: "Shariatpur Bibikhana Pitha",
    nameBn: "\u09B6\u09B0\u09C0\u09AF\u09BC\u09A4\u09AA\u09C1\u09B0\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AC\u09BF\u09AC\u09BF\u0996\u09BE\u09A8\u09BE \u09AA\u09BF\u09A0\u09BE",
    shortDescription: "Rich baked winter cake made with liquid date jaggery, thick coconut milk, and rice flour.",
    detailedDescription: "Bibikhana Pitha is a cherished festive baked rice cake from Shariatpur and Faridpur. Prepared with stone-ground rice flour, concentrated coconut cream, fresh date palm jaggery (nolen gur), and a hint of cardamom, slow-baked with coals on top and bottom.",
    category: "sweets_pitha",
    districtId: "shariatpur",
    divisionId: "dhaka",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    originHistory: "Heritage aristocratic Muslim household winter confection of the lower Padma basin.",
    originSource: "Folk Pitha Archives of Greater Faridpur",
    isPublished: true,
    ingredients: ["Rice Flour", "Nolen Khejur Gur", "Coconut Cream", "Cardamom", "Ghee"],
    approximatePriceBdt: 150,
    dietaryType: "sweet",
    createdAt: "2025-01-26T08:00:00.000Z",
    updatedAt: "2025-01-26T08:00:00.000Z"
  },
  // Noakhali
  {
    id: "food_noakhali_kholajaal",
    nameEn: "Noakhali Kholajaal Pitha & Narikel Naru",
    nameBn: "\u09A8\u09CB\u09AF\u09BC\u09BE\u0996\u09BE\u09B2\u09C0\u09B0 \u0996\u09CB\u09B2\u09BE\u099C\u09BE \u09AA\u09BF\u09A0\u09BE \u0993 \u09A8\u09BE\u09B0\u0995\u09C7\u09B2 \u09A8\u09BE\u09A1\u09BC\u09C1",
    shortDescription: "Delicate lace crepe baked on clay skillet accompanied by spicy duck curry and sweet coconut truffles.",
    detailedDescription: "Kholajaal is an ultra-thin, netted crepe baked without oil on an unglazed earthen pan (khola) made from liquid rice batter and eggs. It takes barely 30 seconds to cook, producing a soft mesh that soaks up spicy duck curry.",
    category: "traditional",
    districtId: "noakhali",
    divisionId: "chattogram",
    imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
    originHistory: "Coastal culinary heritage of Noakhali families.",
    originSource: "Greater Noakhali Cultural Council",
    isPublished: true,
    ingredients: ["Atap Rice Flour", "Eggs", "Water", "Salt"],
    approximatePriceBdt: 60,
    dietaryType: "non-veg",
    createdAt: "2025-01-26T08:00:00.000Z",
    updatedAt: "2025-01-26T08:00:00.000Z"
  },
  // Sunamganj
  {
    id: "food_sunamganj_haor_boal",
    nameEn: "Haor Fresh Boal & Chitol Fish Curry",
    nameBn: "\u09B9\u09BE\u0993\u09B0\u09C7\u09B0 \u09A4\u09BE\u099C\u09BE \u09AC\u09CB\u09AF\u09BC\u09BE\u09B2 \u0993 \u099A\u09BF\u09A4\u09B2 \u09AE\u09BE\u099B\u09C7\u09B0 \u099D\u09CB\u09B2",
    shortDescription: "Wild wetland giant fish simmered with tomato, green coriander, and mustard.",
    detailedDescription: "Tanguar and Hakaluki Haors produce some of Bengal's most sought-after freshwater wild fish. Tender steaks of Boal or Chitol are cooked in light broth with tomatoes, slit chillies, and freshly crushed spices.",
    category: "main_course",
    districtId: "sunamganj",
    divisionId: "sylhet",
    imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
    originHistory: "Traditional haor delta fishermen cooking traditions.",
    originSource: "Sunamganj Wetland Environmental Heritage",
    isPublished: true,
    ingredients: ["Fresh Boal Fish", "Mustard Oil", "Tomato", "Coriander", "Green Chili"],
    approximatePriceBdt: 380,
    dietaryType: "non-veg",
    createdAt: "2025-01-27T08:00:00.000Z",
    updatedAt: "2025-01-27T08:00:00.000Z"
  },
  // Bagerhat
  {
    id: "food_bagerhat_sundarbans_honey",
    nameEn: "Sundarbans Wild Honey & Mud Crab Curry",
    nameBn: "\u09B8\u09C1\u09A8\u09CD\u09A6\u09B0\u09AC\u09A8\u09C7\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u09AE\u09A7\u09C1 \u0993 \u0995\u09BE\u09A6\u09BE \u0995\u09BE\u0981\u0995\u09A1\u09BC\u09BE \u09AD\u09C1\u09A8\u09BE",
    shortDescription: "Fresh mangrove forest mud crab simmered in coconut milk, garlic, and wild Khalisha flower honey.",
    detailedDescription: "Harvested from the mangrove wilderness of the Sundarbans, large mud crabs are cooked in a savory curry spiced with cumin, dried red chili, coconut cream, and glazed lightly with raw mangrove blossom honey.",
    category: "traditional",
    districtId: "bagerhat",
    divisionId: "khulna",
    imageUrl: "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=800&q=80",
    originHistory: "Coastal lifestyle of the Mouwal (honey collectors) and Bawali woodsmen of the Sundarbans.",
    originSource: "Sundarbans Biosphere Cultural Study",
    isPublished: true,
    ingredients: ["Mud Crab", "Coconut Milk", "Sundarbans Honey", "Garlic", "Mustard Oil", "Chili"],
    approximatePriceBdt: 500,
    dietaryType: "non-veg",
    createdAt: "2025-01-27T08:00:00.000Z",
    updatedAt: "2025-01-27T08:00:00.000Z"
  },
  // Jamalpur
  {
    id: "food_jamalpur_morobba",
    nameEn: "Jamalpur Wax Gourd Morobba & Pitha",
    nameBn: "\u099C\u09BE\u09AE\u09BE\u09B2\u09AA\u09C1\u09B0\u09C7\u09B0 \u099A\u09BE\u09B2\u0995\u09C1\u09AE\u09A1\u09BC\u09BE\u09B0 \u09AE\u09CB\u09B0\u09AC\u09CD\u09AC\u09BE \u0993 \u09AA\u09C1\u09B2\u09BF \u09AA\u09BF\u09A0\u09BE",
    shortDescription: "Translucent, crystal-glazed candied wax gourd bites infused with cardamom and rosewater.",
    detailedDescription: "Traditional Morobba of Jamalpur is made from mature ash gourd (chalkumra), carefully pricked, lime-water treated, and stewed in thick clarified sugar syrup until crystalline and translucent.",
    category: "sweets_pitha",
    districtId: "jamalpur",
    divisionId: "mymensingh",
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80",
    originHistory: "Traditional artisanal confectionery heritage along the Old Brahmaputra riverbanks.",
    originSource: "Jamalpur District History Archive",
    isPublished: true,
    ingredients: ["Chalkumra (Ash Gourd)", "Sugar Syrup", "Cardamom", "Rose Water"],
    approximatePriceBdt: 220,
    dietaryType: "sweet",
    createdAt: "2025-01-28T08:00:00.000Z",
    updatedAt: "2025-01-28T08:00:00.000Z"
  },
  // Satkhira
  {
    id: "food_satkhira_golda_sandesh",
    nameEn: "Satkhira Golda Chingri & Sandesh",
    nameBn: "\u09B8\u09BE\u09A4\u0995\u09CD\u09B7\u09C0\u09B0\u09BE\u09B0 \u0997\u09B2\u09A6\u09BE \u099A\u09BF\u0982\u09A1\u09BC\u09BF \u09AE\u09BE\u09B2\u09BE\u0987\u0995\u09BE\u09B0\u09BF \u0993 \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6",
    shortDescription: "Freshwater jumbo prawns cooked in rich coconut cream paired with fresh chhana sandesh.",
    detailedDescription: "Satkhira boasts vast estuaries producing the country's finest giant freshwater prawns (Golda Chingri). Cooked into an authentic Malaikari with fresh grated coconut milk, ghee, and whole spices.",
    category: "main_course",
    districtId: "satkhira",
    divisionId: "khulna",
    imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
    originHistory: "Estuarine coastal culinary heritage of southwestern Bengal.",
    originSource: "Satkhira Coastal Fisheries Record",
    isPublished: true,
    ingredients: ["Golda Prawns", "Coconut Milk", "Ghee", "Cinnamon", "Cardamom", "Green Chillies"],
    approximatePriceBdt: 550,
    dietaryType: "non-veg",
    createdAt: "2025-01-28T08:00:00.000Z",
    updatedAt: "2025-01-28T08:00:00.000Z"
  },
  // Meherpur
  {
    id: "food_meherpur_sabitri",
    nameEn: "Meherpur Sabitri & Roshkodom",
    nameBn: "\u09AE\u09C7\u09B9\u09C7\u09B0\u09AA\u09C1\u09B0\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09B8\u09BE\u09AC\u09BF\u09A4\u09CD\u09B0\u09C0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    shortDescription: "Dry caramelized sweet known for lasting weeks at room temperature without preservatives.",
    detailedDescription: "Sabitri is an ingenious heritage sweet developed in Meherpur town over 150 years ago by Vasudeva Saha. Made from dried chhana and caramelized milk solids, it retains its flavor for weeks without refrigeration.",
    category: "sweets_pitha",
    districtId: "meherpur",
    divisionId: "khulna",
    imageUrl: "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80",
    originHistory: "Created in 1861 by Vasudeva Saha in Meherpur town.",
    originSource: "Historic Mujibnagar District Gazettes",
    isPublished: true,
    ingredients: ["Chhana", "Condensed Milk Solids", "Sugar"],
    approximatePriceBdt: 360,
    dietaryType: "sweet",
    createdAt: "2025-01-29T08:00:00.000Z",
    updatedAt: "2025-01-29T08:00:00.000Z"
  },
  // Chapai Nawabganj
  {
    id: "food_nawabganj_shibganj_chomchom",
    nameEn: "Shibganj-er Chomchom & Khirsapat Mango",
    nameBn: "\u099A\u09BE\u0981\u09AA\u09BE\u0987\u09A8\u09AC\u09BE\u09AC\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u09B6\u09BF\u09AC\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u099A\u09AE\u099A\u09AE",
    shortDescription: "Rich golden sweet with deep mawa fragrance and dense cottage cheese core.",
    detailedDescription: "Shibganj Chomchom in Chapai Nawabganj has been crafted for over a century. Simmered in caramelized sugar syrup until deep amber-brown, dusted with toasted dry milk crumbles.",
    category: "sweets_pitha",
    districtId: "chapai_nawabganj",
    divisionId: "rajshahi",
    imageUrl: "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80",
    originHistory: "Artisanal sweetmakers of Shibganj bazaar dating back to the 1920s.",
    originSource: "Chapai Nawabganj Cultural Society",
    isPublished: true,
    ingredients: ["Cow Milk Chhana", "Sugar", "Mawa", "Cardamom"],
    approximatePriceBdt: 380,
    dietaryType: "sweet",
    createdAt: "2025-01-29T08:00:00.000Z",
    updatedAt: "2025-01-29T08:00:00.000Z"
  },
  // Feni
  {
    id: "food_feni_khondol_mishti",
    nameEn: "Feni Khondol-er Mishti",
    nameBn: "\u09AB\u09C7\u09A8\u09C0\u09B0 \u0996\u09A8\u09CD\u09A6\u09B2\u09C7\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    shortDescription: "Signature soft and juicy regional sweet prepared with fresh local dairy.",
    detailedDescription: "Originated in Khondol market of Parshuram upazila in Feni. Master confectioners use whole cow milk to make delicately textured chhana balls soaked in fragrant warm cardamom syrup.",
    category: "sweets_pitha",
    districtId: "feni",
    divisionId: "chattogram",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    originHistory: "Century-old bazaar heritage in Parshuram, Feni.",
    originSource: "Feni District Cultural Register",
    isPublished: true,
    ingredients: ["Cow Chhana", "Cardamom", "Pure Sugar"],
    approximatePriceBdt: 300,
    dietaryType: "sweet",
    createdAt: "2025-01-30T08:00:00.000Z",
    updatedAt: "2025-01-30T08:00:00.000Z"
  },
  // Patuakhali
  {
    id: "food_patuakhali_kuakata_shutki",
    nameEn: "Kuakata Coastal Shutki Paturi",
    nameBn: "\u0995\u09C1\u09AF\u09BC\u09BE\u0995\u09BE\u099F\u09BE\u09B0 \u09B8\u09BE\u09AE\u09C1\u09A6\u09CD\u09B0\u09BF\u0995 \u09B6\u09C1\u0981\u099F\u0995\u09BF \u09AA\u09BE\u09A4\u09C1\u09B0\u09BF",
    shortDescription: "Coastal sun-dried marine fish steamed in banana leaves with green mustard sauce.",
    detailedDescription: "Kuakata's sea coast provides diverse marine fish like Loitta and Rupchanda. Sun-cured dried fish is mashed with mustard, green chilies, garlic cloves, folded into charred banana leaf packets, and griddled.",
    category: "street_food",
    districtId: "patuakhali",
    divisionId: "barishal",
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    originHistory: "Coastal Rakhine and Bengali artisanal fishermen cuisine.",
    originSource: "Kuakata Coastal Heritage Documentation",
    isPublished: true,
    ingredients: ["Marine Dried Fish", "Mustard Oil", "Garlic", "Green Chili", "Banana Leaves"],
    approximatePriceBdt: 140,
    dietaryType: "non-veg",
    createdAt: "2025-01-30T08:00:00.000Z",
    updatedAt: "2025-01-30T08:00:00.000Z"
  },
  // Pabna
  {
    id: "food_pabna_peda",
    nameEn: "Pabnar Peda Mishti",
    nameBn: "\u09AA\u09BE\u09AC\u09A8\u09BE\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u09A6\u09C1\u09A7\u09C7\u09B0 \u09AA\u09CD\u09AF\u09BE\u09B0\u09BE \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    shortDescription: "Condensed milk fudge discs prepared by slow-stirring pure cow milk over wood heat.",
    detailedDescription: "Pabna is the milk capital of Bangladesh, home to the largest dairy cooperative societies. Pabna Peda is crafted by simmering pure cow milk for hours into dense mawa paste, hand-molded into discs with embossed stamps.",
    category: "sweets_pitha",
    districtId: "pabna",
    divisionId: "rajshahi",
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80",
    originHistory: "Traditional pastoral dairy heritage in Santhia and Chatmohar of Pabna.",
    originSource: "Pabna Dairy Heritage Archives",
    isPublished: true,
    ingredients: ["Concentrated Cow Milk", "Sugar", "Cardamom"],
    approximatePriceBdt: 440,
    dietaryType: "sweet",
    createdAt: "2025-01-31T08:00:00.000Z",
    updatedAt: "2025-01-31T08:00:00.000Z"
  },
  // Munshiganj
  {
    id: "food_munshiganj_bhagyakul",
    nameEn: "Munshiganj Bhagyakul Mistanna",
    nameBn: "\u09AE\u09C1\u09A8\u09CD\u09B8\u09C0\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u09AD\u09BE\u0997\u09CD\u09AF\u0995\u09C2\u09B2\u09C7\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    shortDescription: "Royal Bikrampur heritage sweets made from cow chhana and golden date syrup.",
    detailedDescription: "Bhagyakul in Bikrampur (Munshiganj) was historically known for its royal estates and grand banquets. Confectioners in Bhagyakul create delicate chhana sweets cooked in aromatic winter jaggery.",
    category: "sweets_pitha",
    districtId: "munshiganj",
    divisionId: "dhaka",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    originHistory: "Royal patronages under the Bhagyakul Roy family in the 19th century.",
    originSource: "Bikrampur Historical Society Records",
    isPublished: true,
    ingredients: ["Fresh Chhana", "Cardamom", "Nolen Gur", "Mawa"],
    approximatePriceBdt: 360,
    dietaryType: "sweet",
    createdAt: "2025-01-31T08:00:00.000Z",
    updatedAt: "2025-01-31T08:00:00.000Z"
  }
];

// src/data/achievements.ts
var SYSTEM_ACHIEVEMENTS = [
  {
    id: "first_bite",
    titleEn: "First Bite of Bengal",
    titleBn: "\u09AC\u09BE\u0982\u09B2\u09BE\u09B0 \u09AA\u09CD\u09B0\u09A5\u09AE \u09B8\u09CD\u09AC\u09BE\u09A6",
    descriptionEn: "Logged your very first Bangladeshi food experience.",
    descriptionBn: "\u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09CD\u09B0\u09A5\u09AE \u0996\u09BE\u09AC\u09BE\u09B0 \u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u09BF\u0982 \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u0995\u09B0\u09C7\u099B\u09C7\u09A8\u0964",
    icon: "Utensils",
    category: "count",
    threshold: 1
  },
  {
    id: "sweet_tooth",
    titleEn: "Misti Moghol (Sweet Connoisseur)",
    titleBn: "\u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09AE\u09CB\u0998\u09B2",
    descriptionEn: "Tasted at least 3 heritage Bengali sweets or pithas.",
    descriptionBn: "\u0995\u09AE\u09AA\u0995\u09CD\u09B7\u09C7 \u09E9\u099F\u09BF \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09AC\u09BE \u09AA\u09BF\u09A0\u09BE \u099A\u09C7\u0996\u09C7 \u09A6\u09C7\u0996\u09C7\u099B\u09C7\u09A8\u0964",
    icon: "Cake",
    category: "specialty",
    threshold: 3
  },
  {
    id: "dhaka_foodie",
    titleEn: "Old Dhaka Foodie",
    titleBn: "\u09A2\u09BE\u0995\u09BE\u0987\u09AF\u09BC\u09BE \u0996\u09BE\u09A6\u0995",
    descriptionEn: "Experienced 3 authentic foods from Dhaka division.",
    descriptionBn: "\u09A2\u09BE\u0995\u09BE \u09AC\u09BF\u09AD\u09BE\u0997\u09C7\u09B0 \u09E9\u099F\u09BF \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0996\u09BE\u09AC\u09BE\u09B0 \u0989\u09AA\u09AD\u09CB\u0997 \u0995\u09B0\u09C7\u099B\u09C7\u09A8\u0964",
    icon: "Crown",
    category: "division",
    threshold: 3
  },
  {
    id: "spice_chaser",
    titleEn: "Spicy Explorer",
    titleBn: "\u099D\u09BE\u09B2 \u09AA\u09CD\u09B0\u09C7\u09AE\u09C0 \u0996\u09BE\u09A6\u0995",
    descriptionEn: "Tried Kala Bhuna or Chui Jhal delicacies.",
    descriptionBn: "\u0995\u09BE\u09B2\u09BE \u09AD\u09C1\u09A8\u09BE \u09AC\u09BE \u099A\u09C1\u0987\u099D\u09BE\u09B2\u09C7\u09B0 \u09AE\u09A4\u09CB \u099D\u09BE\u09B2 \u0996\u09BE\u09AC\u09BE\u09B0 \u099A\u09C7\u0996\u09C7\u099B\u09C7\u09A8\u0964",
    icon: "Flame",
    category: "specialty",
    threshold: 2
  },
  {
    id: "five_districts",
    titleEn: "District Hopper",
    titleBn: "\u099C\u09C7\u09B2\u09BE \u09AA\u09B0\u09BF\u09AD\u09CD\u09B0\u09AE\u09A3\u0995\u09BE\u09B0\u09C0",
    descriptionEn: "Explored foods from 5 different districts.",
    descriptionBn: "\u09EB\u099F\u09BF \u09AD\u09BF\u09A8\u09CD\u09A8 \u099C\u09C7\u09B2\u09BE\u09B0 \u0996\u09BE\u09AC\u09BE\u09B0 \u0986\u09AC\u09BF\u09B7\u09CD\u0995\u09BE\u09B0 \u0995\u09B0\u09C7\u099B\u09C7\u09A8\u0964",
    icon: "Compass",
    category: "count",
    threshold: 5
  },
  {
    id: "ten_districts",
    titleEn: "True Khadok (Food Adventurer)",
    titleBn: "\u0996\u09BE\u0981\u099F\u09BF \u0996\u09BE\u09A6\u0995",
    descriptionEn: "Explored foods from 10 different districts.",
    descriptionBn: "\u09E7\u09E6\u099F\u09BF \u09AD\u09BF\u09A8\u09CD\u09A8 \u099C\u09C7\u09B2\u09BE\u09B0 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09AA\u09A6 \u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u09BF\u0982 \u0995\u09B0\u09C7\u099B\u09C7\u09A8\u0964",
    icon: "Award",
    category: "count",
    threshold: 10
  },
  {
    id: "division_master",
    titleEn: "All-Divisions Connoisseur",
    titleBn: "\u0985\u09B7\u09CD\u099F\u09AC\u09BF\u09AD\u09BE\u0997 \u099C\u09AF\u09BC\u09C0",
    descriptionEn: "Tasted at least one dish from all 8 divisions of Bangladesh.",
    descriptionBn: "\u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C7\u09B0 \u09EE\u099F\u09BF \u09AC\u09BF\u09AD\u09BE\u0997\u09C7\u09B0 \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u09A5\u09C7\u0995\u09C7\u0987 \u0996\u09BE\u09AC\u09BE\u09B0 \u099A\u09C7\u0996\u09C7 \u09A6\u09C7\u0996\u09C7\u099B\u09C7\u09A8\u0964",
    icon: "MapPin",
    category: "division",
    threshold: 8
  }
];

// server/db.ts
var DATA_DIR = path.resolve(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "foodie_bd.json");
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}
function createPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  return { hash, salt };
}
function verifyPassword(password, hash, salt) {
  const calculated = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(calculated, "hex"), Buffer.from(hash, "hex"));
}
var PRIMARY_ADMIN_EMAIL = "salahuddinazad01631@gmail.com";
var PRIMARY_ADMIN_PASSWORD = "Super@dmin01";
var Database = class {
  constructor() {
    this.data = this.init();
  }
  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(fileContent);
        parsed.divisions = DIVISIONS;
        parsed.districts = DISTRICTS;
        parsed.categories = FOOD_CATEGORIES;
        if (!parsed.foods || parsed.foods.length === 0) parsed.foods = SEED_FOODS;
        if (!parsed.foodSubmissions) parsed.foodSubmissions = [];
        if (!parsed.userFoods) parsed.userFoods = [];
        if (!parsed.foodReviews) parsed.foodReviews = [];
        if (!parsed.achievements) parsed.achievements = SYSTEM_ACHIEVEMENTS;
        if (!parsed.reports) parsed.reports = [];
        if (!parsed.auditLogs) parsed.auditLogs = [];
        if (!parsed.users) parsed.users = [];
        const superAdminRecord = createPasswordRecord(PRIMARY_ADMIN_PASSWORD);
        const existingPrimaryAdmin = parsed.users.find(
          (u) => u.email && u.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()
        );
        if (!existingPrimaryAdmin) {
          parsed.users.unshift({
            id: "user_admin_primary",
            name: "Salahuddin Azad (Admin)",
            email: PRIMARY_ADMIN_EMAIL,
            role: "admin",
            passwordHash: superAdminRecord.hash,
            salt: superAdminRecord.salt,
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            homeDistrictId: "dhaka",
            bio: "Head administrator and curator of Foodie BD.",
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        } else {
          existingPrimaryAdmin.role = "admin";
          if (!verifyPassword(PRIMARY_ADMIN_PASSWORD, existingPrimaryAdmin.passwordHash, existingPrimaryAdmin.salt)) {
            existingPrimaryAdmin.passwordHash = superAdminRecord.hash;
            existingPrimaryAdmin.salt = superAdminRecord.salt;
          }
        }
        const existingLegacyAdmin = parsed.users.find(
          (u) => u.email && u.email.toLowerCase() === "admin@foodiebd.com"
        );
        if (!existingLegacyAdmin) {
          const legacyPass = createPasswordRecord("AdminPass123!");
          parsed.users.push({
            id: "user_admin_01",
            name: "Foodie BD Admin",
            email: "admin@foodiebd.com",
            role: "admin",
            passwordHash: legacyPass.hash,
            salt: legacyPass.salt,
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            homeDistrictId: "dhaka",
            bio: "Head curator of Foodie BD culinary preservation registry.",
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        return parsed;
      } catch (err) {
        console.error("Error reading db file, re-initializing database:", err);
      }
    }
    const superAdminPass = createPasswordRecord(PRIMARY_ADMIN_PASSWORD);
    const adminPass = createPasswordRecord("AdminPass123!");
    const demoUserPass = createPasswordRecord("Foodie123!");
    const initialUsers = [
      {
        id: "user_admin_primary",
        name: "Salahuddin Azad (Admin)",
        email: PRIMARY_ADMIN_EMAIL,
        role: "admin",
        passwordHash: superAdminPass.hash,
        salt: superAdminPass.salt,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        homeDistrictId: "dhaka",
        bio: "Head administrator and curator of Foodie BD.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "user_admin_01",
        name: "Foodie BD Admin",
        email: "admin@foodiebd.com",
        role: "admin",
        passwordHash: adminPass.hash,
        salt: adminPass.salt,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        homeDistrictId: "dhaka",
        bio: "Head curator of Foodie BD culinary preservation registry.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "user_demo_01",
        name: "Tanvir Hossain",
        email: "foodie@example.com",
        role: "user",
        passwordHash: demoUserPass.hash,
        salt: demoUserPass.salt,
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        homeDistrictId: "chattogram",
        bio: "Passionate food explorer on a mission to taste all 64 districts!",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    const initialUserFoods = [
      {
        id: "uf_01",
        userId: "user_demo_01",
        foodId: "food_dhaka_kacchi",
        status: "tried",
        triedAt: "2025-01-10T14:30:00.000Z",
        rating: 5,
        notes: "Unbelievably tender mutton with melt-in-the-mouth potato. The aroma of saffron and ghee is unbeatable!",
        photoUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
        updatedAt: "2025-01-10T14:30:00.000Z"
      },
      {
        id: "uf_02",
        userId: "user_demo_01",
        foodId: "food_ctg_kala_bhuna",
        status: "tried",
        triedAt: "2025-01-12T20:00:00.000Z",
        rating: 5,
        notes: "Smoky, intensely spiced beef with crisp outer bark. Best with hot tandoori ruti.",
        photoUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
        updatedAt: "2025-01-12T20:00:00.000Z"
      },
      {
        id: "uf_03",
        userId: "user_demo_01",
        foodId: "food_bogura_doi",
        status: "tried",
        triedAt: "2025-01-15T16:00:00.000Z",
        rating: 5,
        notes: "Pure heaven in an earthen cup. Caramelized sweetness without any artificial aftertaste.",
        updatedAt: "2025-01-15T16:00:00.000Z"
      },
      {
        id: "uf_04",
        userId: "user_demo_01",
        foodId: "food_cumilla_rasmalai",
        status: "want_to_try",
        updatedAt: "2025-01-16T10:00:00.000Z"
      },
      {
        id: "uf_05",
        userId: "user_demo_01",
        foodId: "food_khulna_chui_jhal",
        status: "want_to_try",
        updatedAt: "2025-01-16T11:00:00.000Z"
      }
    ];
    const initialReviews = [
      {
        id: "rev_01",
        userId: "user_demo_01",
        userName: "Tanvir Hossain",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        foodId: "food_dhaka_kacchi",
        rating: 5,
        comment: "Authentic Old Dhaka kacchi biryani has a distinct richness you simply cannot replicate anywhere else.",
        createdAt: "2025-01-10T15:00:00.000Z"
      },
      {
        id: "rev_02",
        userId: "user_demo_01",
        userName: "Tanvir Hossain",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        foodId: "food_ctg_kala_bhuna",
        rating: 5,
        comment: "Spices cling to the meat perfectly. An absolute must-eat when visiting Chittagong.",
        createdAt: "2025-01-12T20:15:00.000Z"
      }
    ];
    const initialAudit = [
      {
        id: "audit_01",
        action: "INITIALIZE_SYSTEM",
        entityType: "SYSTEM",
        entityId: "seed",
        userId: "user_admin_01",
        userName: "Foodie BD Admin",
        details: "Initial database bootstrap with verified 8 divisions, 64 districts, and core culinary catalog.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    const schema = {
      users: initialUsers,
      divisions: DIVISIONS,
      districts: DISTRICTS,
      categories: FOOD_CATEGORIES,
      foods: SEED_FOODS,
      foodSubmissions: [],
      userFoods: initialUserFoods,
      foodReviews: initialReviews,
      achievements: SYSTEM_ACHIEVEMENTS,
      reports: [],
      auditLogs: initialAudit
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(schema, null, 2), "utf-8");
    return schema;
  }
  save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
  }
  getSchema() {
    return this.data;
  }
  logAudit(log) {
    const entry = {
      ...log,
      id: "audit_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.auditLogs.unshift(entry);
    this.save();
  }
};
var db = new Database();

// server/postgres.ts
import "dotenv/config";
import pg from "pg";
var { Pool } = pg;
var pool = null;
var lastKnownStatus = {
  isConnected: false,
  provider: "none"
};
function getPostgresPool() {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes("db.example.com")) {
    console.warn("[DATABASE POOL]: Invalid or missing DATABASE_URL.");
    return null;
  }
  try {
    const isRemote = connectionString.includes("supabase") || connectionString.includes("pooler.supabase.com") || connectionString.includes("sslmode=") || process.env.NODE_ENV === "production" || !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1");
    pool = new Pool({
      connectionString,
      ssl: isRemote ? { rejectUnauthorized: false } : void 0,
      max: process.env.NODE_ENV === "production" ? 3 : 10,
      // Optimized connection limit for serverless
      idleTimeoutMillis: 15e3,
      connectionTimeoutMillis: 5e3,
      statement_timeout: 8e3
      // 8-second query timeout to prevent hanging database operations
    });
    pool.on("error", (err) => {
      console.error("[DATABASE POOL ERROR]: Unexpected idle client error:", err.message);
      pool = null;
    });
    return pool;
  } catch (err) {
    console.error("[DATABASE POOL INITIALIZATION FAILED]:", err.message);
    return null;
  }
}
async function testPostgresConnection() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes("db.example.com")) {
    lastKnownStatus = {
      isConnected: false,
      provider: "none",
      error: "DATABASE_URL is not configured properly in environment variables."
    };
    return lastKnownStatus;
  }
  const p = getPostgresPool();
  if (!p) {
    lastKnownStatus = {
      isConnected: false,
      provider: "none",
      error: "Could not initialize PostgreSQL pool."
    };
    return lastKnownStatus;
  }
  try {
    const connectPromise = p.connect();
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("PostgreSQL connection timed out after 5s")), 5e3)
    );
    const client = await Promise.race([connectPromise, timeoutPromise]);
    try {
      const res = await client.query("SELECT NOW() AS now, current_database() as db, version() as ver;");
      const isSupabase = connectionString.includes("supabase");
      lastKnownStatus = {
        isConnected: true,
        provider: isSupabase ? "supabase_postgres" : "local_postgres",
        database: res.rows[0]?.db
      };
      return lastKnownStatus;
    } finally {
      client.release();
    }
  } catch (err) {
    const sanitizedError = (err.message || "Connection failed").replace(/:\/\/[^@]+@/, "://***:***@").replace(/password=[^ &]+/gi, "password=***");
    lastKnownStatus = {
      isConnected: false,
      provider: "none",
      error: `PostgreSQL connection failed: ${sanitizedError}`
    };
    return lastKnownStatus;
  }
}
async function query(sql, params = []) {
  const p = getPostgresPool();
  if (!p) {
    console.error("[DATABASE QUERY BLOCKED]: Pool not available.");
    return { rows: [], command: "", rowCount: 0, oid: 0, fields: [] };
  }
  try {
    return await p.query(sql, params);
  } catch (error) {
    console.error("[DATABASE QUERY ERROR]:", error.message);
    throw error;
  }
}

// server/postgresDal.ts
function mapDivisionRow(row) {
  return {
    id: row.id,
    nameEn: row.name_en,
    nameBn: row.name_bn,
    capitalEn: row.capital_en,
    capitalBn: row.capital_bn
  };
}
function mapDistrictRow(row) {
  return {
    id: row.id,
    divisionId: row.division_id,
    nameEn: row.name_en,
    nameBn: row.name_bn,
    shapeName: row.shape_name,
    lat: Number(row.lat),
    lng: Number(row.lng),
    prominentDishEn: row.prominent_dish_en,
    prominentDishBn: row.prominent_dish_bn,
    description: row.description || "",
    foodsCount: Number(row.foods_count || 0)
  };
}
function mapCategoryRow(row) {
  return {
    id: row.id,
    nameEn: row.name_en,
    nameBn: row.name_bn,
    description: row.description || ""
  };
}
function mapProfileRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatar_url || void 0,
    homeDistrictId: row.home_district_id || void 0,
    bio: row.bio || void 0,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
    passwordHash: row.password_hash,
    salt: row.salt
  };
}
function mapFoodRow(row) {
  return {
    id: row.id,
    nameEn: row.name_en,
    nameBn: row.name_bn,
    shortDescription: row.short_description,
    detailedDescription: row.detailed_description || row.short_description,
    category: row.category_id,
    districtId: row.district_id,
    divisionId: row.division_id,
    imageUrl: row.image_url,
    originHistory: row.origin_history || "",
    originSource: row.origin_source || "",
    isPublished: Boolean(row.is_published),
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    approximatePriceBdt: Number(row.approximate_price_bdt || 0),
    dietaryType: row.dietary || "non-veg",
    submissionId: row.submission_id || void 0,
    submittedByUserId: row.submitted_by_user_id || void 0,
    submittedByUserName: row.submitted_by_user_name || void 0,
    approvedByUserId: row.approved_by_user_id || void 0,
    approvedByUserName: row.approved_by_user_name || void 0,
    approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : void 0,
    verificationStatus: row.verification_status || "admin_created",
    researchStatus: row.research_status || void 0,
    citationSources: Array.isArray(row.citation_sources) ? row.citation_sources : [],
    imageCaption: row.image_caption || void 0,
    imageAttribution: row.image_attribution || void 0,
    imageVerified: Boolean(row.image_verified),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
  };
}
function mapSubmissionRow(row) {
  let editHistory = [];
  if (Array.isArray(row.edit_history)) {
    editHistory = row.edit_history;
  } else if (typeof row.edit_history === "string") {
    try {
      editHistory = JSON.parse(row.edit_history);
    } catch {
    }
  }
  return {
    id: row.id,
    nameEn: row.name_en,
    nameBn: row.name_bn,
    shortDescription: row.short_description,
    detailedDescription: row.detailed_description || void 0,
    category: row.category_id,
    districtId: row.district_id,
    divisionId: row.division_id,
    imageUrl: row.image_url,
    originHistory: row.origin_history || void 0,
    originSource: row.origin_source || void 0,
    approximatePriceBdt: Number(row.approximate_price_bdt || 0),
    dietaryType: row.dietary_type || "non-veg",
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    accurateInfoConfirmed: Boolean(row.accurate_info_confirmed),
    userId: row.user_id,
    submitterName: row.submitter_name,
    status: row.status,
    reviewedByUserId: row.reviewed_by_user_id || void 0,
    reviewedByUserName: row.reviewed_by_user_name || void 0,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : void 0,
    adminFeedback: row.admin_feedback || void 0,
    approvedFoodId: row.approved_food_id || void 0,
    editHistory,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
  };
}
function mapUserFoodRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    foodId: row.food_id,
    status: row.status,
    triedAt: row.tried_at ? new Date(row.tried_at).toISOString() : void 0,
    rating: row.rating ? Number(row.rating) : void 0,
    notes: row.notes || void 0,
    photoUrl: row.photo_url || void 0,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
  };
}
function mapReviewRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || "Foodie Member",
    userAvatar: row.user_avatar || void 0,
    foodId: row.food_id,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
  };
}
function mapAchievementRow(row) {
  return {
    id: row.id,
    titleEn: row.title_en,
    titleBn: row.title_bn,
    descriptionEn: row.description_en,
    descriptionBn: row.description_bn,
    icon: row.icon,
    category: row.category,
    threshold: Number(row.threshold || 1)
  };
}
function mapReportRow(row) {
  return {
    id: row.id,
    reporterUserId: row.reporter_user_id,
    foodId: row.food_id || void 0,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
  };
}
function mapAuditLogRow(row) {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    userId: row.user_id || "system",
    userName: row.user_name,
    details: row.details,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
  };
}
var PostgresDataAccessLayer = class {
  // ----------------------------------------------------
  // Divisions & Districts & Categories
  // ----------------------------------------------------
  async getDivisions() {
    const res = await query("SELECT * FROM divisions ORDER BY name_en ASC");
    return res.rows.map(mapDivisionRow);
  }
  async getDistricts() {
    const sql = `
      SELECT d.*, COUNT(f.id)::int as foods_count
      FROM districts d
      LEFT JOIN foods f ON f.district_id = d.id AND f.is_published = true
      GROUP BY d.id
      ORDER BY d.name_en ASC
    `;
    const res = await query(sql);
    return res.rows.map(mapDistrictRow);
  }
  async getDistrictById(id) {
    const sql = `
      SELECT d.*, COUNT(f.id)::int as foods_count
      FROM districts d
      LEFT JOIN foods f ON f.district_id = d.id AND f.is_published = true
      WHERE d.id = $1
      GROUP BY d.id
    `;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) return null;
    return mapDistrictRow(res.rows[0]);
  }
  async getCategories() {
    const res = await query("SELECT * FROM food_categories ORDER BY id ASC");
    return res.rows.map(mapCategoryRow);
  }
  // ----------------------------------------------------
  // Users & Authentication
  // ----------------------------------------------------
  async getUserById(id) {
    const res = await query("SELECT * FROM profiles WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    return mapProfileRow(res.rows[0]);
  }
  async getUserByEmail(email) {
    const res = await query("SELECT * FROM profiles WHERE LOWER(email) = LOWER($1)", [email.trim()]);
    if (res.rows.length === 0) return null;
    return mapProfileRow(res.rows[0]);
  }
  async getAllUsers() {
    const res = await query("SELECT id, name, email, role, avatar_url, home_district_id, bio, created_at FROM profiles ORDER BY created_at DESC");
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      avatarUrl: r.avatar_url || void 0,
      homeDistrictId: r.home_district_id || void 0,
      bio: r.bio || void 0,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
    }));
  }
  async hasAdmin() {
    const res = await query("SELECT EXISTS(SELECT 1 FROM profiles WHERE role = 'admin') as has_admin");
    return Boolean(res.rows[0]?.has_admin);
  }
  async createUser(user) {
    const sql = `
      INSERT INTO profiles (
        id, name, email, password_hash, salt, role, avatar_url, home_district_id, bio, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const params = [
      user.id,
      user.name,
      user.email,
      user.passwordHash,
      user.salt,
      user.role,
      user.avatarUrl || null,
      user.homeDistrictId || null,
      user.bio || null,
      user.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      (/* @__PURE__ */ new Date()).toISOString()
    ];
    const res = await query(sql, params);
    return mapProfileRow(res.rows[0]);
  }
  async updateUserProfile(id, updates) {
    const sql = `
      UPDATE profiles
      SET name = COALESCE($2, name),
          avatar_url = COALESCE($3, avatar_url),
          home_district_id = COALESCE($4, home_district_id),
          bio = COALESCE($5, bio),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const params = [
      id,
      updates.name !== void 0 ? updates.name : null,
      updates.avatarUrl !== void 0 ? updates.avatarUrl : null,
      updates.homeDistrictId !== void 0 ? updates.homeDistrictId : null,
      updates.bio !== void 0 ? updates.bio : null
    ];
    const res = await query(sql, params);
    if (res.rows.length === 0) throw new Error("User profile not found.");
    const u = mapProfileRow(res.rows[0]);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl,
      homeDistrictId: u.homeDistrictId,
      bio: u.bio,
      createdAt: u.createdAt
    };
  }
  async updateUserPassword(id, passwordHash, salt) {
    const res = await query("UPDATE profiles SET password_hash = $2, salt = $3, updated_at = NOW() WHERE id = $1", [
      id,
      passwordHash,
      salt
    ]);
    return (res.rowCount ?? 0) > 0;
  }
  async updateUserRole(id, role) {
    const existing = await this.getUserById(id);
    if (!existing) throw new Error("User not found.");
    if (existing.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() && role !== "admin") {
      throw new Error("Primary administrator role cannot be downgraded.");
    }
    const res = await query("UPDATE profiles SET role = $2, updated_at = NOW() WHERE id = $1 RETURNING *", [id, role]);
    if (res.rows.length === 0) throw new Error("User not found.");
    const u = mapProfileRow(res.rows[0]);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl,
      homeDistrictId: u.homeDistrictId,
      bio: u.bio,
      createdAt: u.createdAt
    };
  }
  // ----------------------------------------------------
  // Foods
  // ----------------------------------------------------
  async getFoods(options = {}) {
    let sql = "SELECT * FROM foods WHERE 1=1";
    const params = [];
    let pIdx = 1;
    if (!options.includeDrafts) {
      sql += ` AND is_published = true`;
    }
    if (options.divisionId && options.divisionId !== "all") {
      sql += ` AND division_id = $${pIdx++}`;
      params.push(options.divisionId);
    }
    if (options.districtId && options.districtId !== "all") {
      sql += ` AND district_id = $${pIdx++}`;
      params.push(options.districtId);
    }
    if (options.category && options.category !== "all") {
      sql += ` AND category_id = $${pIdx++}`;
      params.push(options.category);
    }
    if (options.dietary && options.dietary !== "all") {
      sql += ` AND dietary = $${pIdx++}`;
      params.push(options.dietary);
    }
    if (options.search && options.search.trim()) {
      const q = `%${options.search.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(name_en) LIKE $${pIdx} OR name_bn LIKE $${pIdx} OR LOWER(short_description) LIKE $${pIdx})`;
      params.push(q);
      pIdx++;
    }
    sql += " ORDER BY created_at DESC";
    const res = await query(sql, params);
    return res.rows.map(mapFoodRow);
  }
  async getFoodById(id) {
    const res = await query("SELECT * FROM foods WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    return mapFoodRow(res.rows[0]);
  }
  async createFood(food) {
    const sql = `
      INSERT INTO foods (
        id, name_en, name_bn, short_description, detailed_description,
        category_id, district_id, division_id, image_url, origin_history,
        origin_source, approximate_price_bdt, dietary, is_published, ingredients,
        submission_id, submitted_by_user_id, submitted_by_user_name,
        approved_by_user_id, approved_by_user_name, approved_at, verification_status,
        research_status, citation_sources, image_caption, image_attribution, image_verified,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      RETURNING *
    `;
    const params = [
      food.id,
      food.nameEn,
      food.nameBn,
      food.shortDescription,
      food.detailedDescription,
      food.category,
      food.districtId,
      food.divisionId,
      food.imageUrl,
      food.originHistory || "",
      food.originSource || "",
      food.approximatePriceBdt || 0,
      food.dietaryType || "non-veg",
      food.isPublished ?? true,
      food.ingredients || [],
      food.submissionId || null,
      food.submittedByUserId || null,
      food.submittedByUserName || null,
      food.approvedByUserId || null,
      food.approvedByUserName || null,
      food.approvedAt || null,
      food.verificationStatus || "admin_created",
      food.researchStatus || null,
      food.citationSources || [],
      food.imageCaption || null,
      food.imageAttribution || null,
      Boolean(food.imageVerified),
      food.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      food.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
    ];
    const res = await query(sql, params);
    return mapFoodRow(res.rows[0]);
  }
  async updateFood(id, updates) {
    const existing = await this.getFoodById(id);
    if (!existing) throw new Error("Food record not found.");
    const sql = `
      UPDATE foods
      SET name_en = COALESCE($2, name_en),
          name_bn = COALESCE($3, name_bn),
          short_description = COALESCE($4, short_description),
          detailed_description = COALESCE($5, detailed_description),
          category_id = COALESCE($6, category_id),
          district_id = COALESCE($7, district_id),
          division_id = COALESCE($8, division_id),
          image_url = COALESCE($9, image_url),
          origin_history = COALESCE($10, origin_history),
          origin_source = COALESCE($11, origin_source),
          approximate_price_bdt = COALESCE($12, approximate_price_bdt),
          dietary = COALESCE($13, dietary),
          is_published = COALESCE($14, is_published),
          ingredients = COALESCE($15, ingredients),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const params = [
      id,
      updates.nameEn !== void 0 ? updates.nameEn : null,
      updates.nameBn !== void 0 ? updates.nameBn : null,
      updates.shortDescription !== void 0 ? updates.shortDescription : null,
      updates.detailedDescription !== void 0 ? updates.detailedDescription : null,
      updates.category !== void 0 ? updates.category : null,
      updates.districtId !== void 0 ? updates.districtId : null,
      updates.divisionId !== void 0 ? updates.divisionId : null,
      updates.imageUrl !== void 0 ? updates.imageUrl : null,
      updates.originHistory !== void 0 ? updates.originHistory : null,
      updates.originSource !== void 0 ? updates.originSource : null,
      updates.approximatePriceBdt !== void 0 ? updates.approximatePriceBdt : null,
      updates.dietaryType !== void 0 ? updates.dietaryType : null,
      updates.isPublished !== void 0 ? updates.isPublished : null,
      updates.ingredients !== void 0 ? updates.ingredients : null
    ];
    const res = await query(sql, params);
    return mapFoodRow(res.rows[0]);
  }
  async togglePublishFood(id, isPublished) {
    const res = await query("UPDATE foods SET is_published = $2, updated_at = NOW() WHERE id = $1 RETURNING *", [
      id,
      isPublished
    ]);
    if (res.rows.length === 0) throw new Error("Food record not found.");
    return mapFoodRow(res.rows[0]);
  }
  async deleteFood(id) {
    const res = await query("DELETE FROM foods WHERE id = $1", [id]);
    return (res.rowCount ?? 0) > 0;
  }
  // ----------------------------------------------------
  // Food Submissions
  // ----------------------------------------------------
  async getSubmissions(options = {}) {
    let sql = "SELECT * FROM food_submissions WHERE 1=1";
    const params = [];
    let pIdx = 1;
    if (options.userId) {
      sql += ` AND user_id = $${pIdx++}`;
      params.push(options.userId);
    }
    if (options.status && options.status !== "all") {
      sql += ` AND status = $${pIdx++}`;
      params.push(options.status);
    }
    if (options.districtId && options.districtId !== "all") {
      sql += ` AND district_id = $${pIdx++}`;
      params.push(options.districtId);
    }
    sql += " ORDER BY created_at DESC";
    const res = await query(sql, params);
    return res.rows.map(mapSubmissionRow);
  }
  async getSubmissionById(id) {
    const res = await query("SELECT * FROM food_submissions WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    return mapSubmissionRow(res.rows[0]);
  }
  async createSubmission(sub) {
    const sql = `
      INSERT INTO food_submissions (
        id, name_en, name_bn, short_description, detailed_description,
        category_id, district_id, division_id, image_url, origin_history,
        origin_source, approximate_price_bdt, dietary_type, ingredients,
        accurate_info_confirmed, user_id, submitter_name, status,
        reviewed_by_user_id, reviewed_by_user_name, reviewed_at, admin_feedback,
        approved_food_id, edit_history, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING *
    `;
    const params = [
      sub.id,
      sub.nameEn,
      sub.nameBn,
      sub.shortDescription,
      sub.detailedDescription || null,
      sub.category,
      sub.districtId,
      sub.divisionId,
      sub.imageUrl,
      sub.originHistory || null,
      sub.originSource || null,
      sub.approximatePriceBdt || 0,
      sub.dietaryType || "non-veg",
      sub.ingredients || [],
      sub.accurateInfoConfirmed ?? true,
      sub.userId,
      sub.submitterName,
      sub.status || "pending",
      sub.reviewedByUserId || null,
      sub.reviewedByUserName || null,
      sub.reviewedAt || null,
      sub.adminFeedback || null,
      sub.approvedFoodId || null,
      JSON.stringify(sub.editHistory || []),
      sub.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      sub.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
    ];
    const res = await query(sql, params);
    return mapSubmissionRow(res.rows[0]);
  }
  async updateSubmission(id, updates) {
    const existing = await this.getSubmissionById(id);
    if (!existing) throw new Error("Submission not found.");
    const sql = `
      UPDATE food_submissions
      SET name_en = COALESCE($2, name_en),
          name_bn = COALESCE($3, name_bn),
          short_description = COALESCE($4, short_description),
          detailed_description = COALESCE($5, detailed_description),
          category_id = COALESCE($6, category_id),
          district_id = COALESCE($7, district_id),
          division_id = COALESCE($8, division_id),
          image_url = COALESCE($9, image_url),
          origin_history = COALESCE($10, origin_history),
          origin_source = COALESCE($11, origin_source),
          approximate_price_bdt = COALESCE($12, approximate_price_bdt),
          dietary_type = COALESCE($13, dietary_type),
          ingredients = COALESCE($14, ingredients),
          edit_history = COALESCE($15, edit_history),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const params = [
      id,
      updates.nameEn !== void 0 ? updates.nameEn : null,
      updates.nameBn !== void 0 ? updates.nameBn : null,
      updates.shortDescription !== void 0 ? updates.shortDescription : null,
      updates.detailedDescription !== void 0 ? updates.detailedDescription : null,
      updates.category !== void 0 ? updates.category : null,
      updates.districtId !== void 0 ? updates.districtId : null,
      updates.divisionId !== void 0 ? updates.divisionId : null,
      updates.imageUrl !== void 0 ? updates.imageUrl : null,
      updates.originHistory !== void 0 ? updates.originHistory : null,
      updates.originSource !== void 0 ? updates.originSource : null,
      updates.approximatePriceBdt !== void 0 ? updates.approximatePriceBdt : null,
      updates.dietaryType !== void 0 ? updates.dietaryType : null,
      updates.ingredients !== void 0 ? updates.ingredients : null,
      updates.editHistory !== void 0 ? JSON.stringify(updates.editHistory) : null
    ];
    const res = await query(sql, params);
    return mapSubmissionRow(res.rows[0]);
  }
  async reviewSubmission(id, review) {
    const sql = `
      UPDATE food_submissions
      SET status = $2,
          reviewed_by_user_id = $3,
          reviewed_by_user_name = $4,
          reviewed_at = NOW(),
          admin_feedback = $5,
          approved_food_id = $6,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const params = [
      id,
      review.status,
      review.reviewedByUserId,
      review.reviewedByUserName,
      review.adminFeedback || null,
      review.approvedFoodId || null
    ];
    const res = await query(sql, params);
    if (res.rows.length === 0) throw new Error("Submission not found.");
    return mapSubmissionRow(res.rows[0]);
  }
  // ----------------------------------------------------
  // User Food Tracking (Journey)
  // ----------------------------------------------------
  async getUserFoods(userId) {
    const res = await query("SELECT * FROM user_foods WHERE user_id = $1 ORDER BY updated_at DESC", [userId]);
    return res.rows.map(mapUserFoodRow);
  }
  async getUserFood(userId, foodId) {
    const res = await query("SELECT * FROM user_foods WHERE user_id = $1 AND food_id = $2", [userId, foodId]);
    if (res.rows.length === 0) return null;
    return mapUserFoodRow(res.rows[0]);
  }
  async upsertUserFood(tracking) {
    const sql = `
      INSERT INTO user_foods (id, user_id, food_id, status, tried_at, rating, notes, photo_url, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id, food_id) DO UPDATE
      SET status = EXCLUDED.status,
          tried_at = EXCLUDED.tried_at,
          rating = EXCLUDED.rating,
          notes = EXCLUDED.notes,
          photo_url = EXCLUDED.photo_url,
          updated_at = NOW()
      RETURNING *
    `;
    const params = [
      tracking.id,
      tracking.userId,
      tracking.foodId,
      tracking.status,
      tracking.triedAt || null,
      tracking.rating || null,
      tracking.notes || null,
      tracking.photoUrl || null,
      tracking.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
    ];
    const res = await query(sql, params);
    return mapUserFoodRow(res.rows[0]);
  }
  async deleteUserFood(userId, foodId) {
    const res = await query("DELETE FROM user_foods WHERE user_id = $1 AND food_id = $2", [userId, foodId]);
    return (res.rowCount ?? 0) > 0;
  }
  // ----------------------------------------------------
  // Reviews
  // ----------------------------------------------------
  async getReviews(foodId) {
    let sql = `
      SELECT fr.*, p.name as user_name, p.avatar_url as user_avatar
      FROM food_reviews fr
      LEFT JOIN profiles p ON fr.user_id = p.id
    `;
    const params = [];
    if (foodId) {
      sql += " WHERE fr.food_id = $1";
      params.push(foodId);
    }
    sql += " ORDER BY fr.created_at DESC";
    const res = await query(sql, params);
    return res.rows.map(mapReviewRow);
  }
  async getReviewById(id) {
    const sql = `
      SELECT fr.*, p.name as user_name, p.avatar_url as user_avatar
      FROM food_reviews fr
      LEFT JOIN profiles p ON fr.user_id = p.id
      WHERE fr.id = $1
    `;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) return null;
    return mapReviewRow(res.rows[0]);
  }
  async createReview(review) {
    const sql = `
      INSERT INTO food_reviews (id, user_id, food_id, rating, comment, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      review.id,
      review.userId,
      review.foodId,
      review.rating,
      review.comment,
      review.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    ];
    const res = await query(sql, params);
    const created = res.rows[0];
    return {
      id: created.id,
      userId: created.user_id,
      userName: review.userName,
      userAvatar: review.userAvatar,
      foodId: created.food_id,
      rating: Number(created.rating),
      comment: created.comment,
      createdAt: created.created_at ? new Date(created.created_at).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async deleteReview(id) {
    const res = await query("DELETE FROM food_reviews WHERE id = $1", [id]);
    return (res.rowCount ?? 0) > 0;
  }
  // ----------------------------------------------------
  // Achievements
  // ----------------------------------------------------
  async getAchievements() {
    const res = await query("SELECT * FROM achievements ORDER BY id ASC");
    return res.rows.map(mapAchievementRow);
  }
  // ----------------------------------------------------
  // Reports
  // ----------------------------------------------------
  async getReports() {
    const res = await query("SELECT * FROM reports ORDER BY created_at DESC");
    return res.rows.map(mapReportRow);
  }
  async createReport(report) {
    const sql = `
      INSERT INTO reports (id, reporter_user_id, food_id, reason, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      report.id,
      report.reporterUserId,
      report.foodId || null,
      report.reason,
      report.status || "pending",
      report.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    ];
    const res = await query(sql, params);
    return mapReportRow(res.rows[0]);
  }
  async updateReportStatus(id, status) {
    const res = await query("UPDATE reports SET status = $2 WHERE id = $1 RETURNING *", [id, status]);
    if (res.rows.length === 0) throw new Error("Report not found.");
    return mapReportRow(res.rows[0]);
  }
  // ----------------------------------------------------
  // Audit Logs
  // ----------------------------------------------------
  async getAuditLogs(limit = 50) {
    const res = await query("SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT $1", [limit]);
    return res.rows.map(mapAuditLogRow);
  }
  async logAudit(log) {
    const id = "audit_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const sql = `
      INSERT INTO admin_audit_logs (id, action, entity_type, entity_id, user_id, user_name, details, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const params = [
      id,
      log.action,
      log.entityType,
      log.entityId,
      log.userId || null,
      log.userName || "System",
      log.details || "",
      createdAt
    ];
    const res = await query(sql, params);
    return mapAuditLogRow(res.rows[0]);
  }
  // ----------------------------------------------------
  // Platform Stats & Overview
  // ----------------------------------------------------
  async getPlatformStats() {
    const sql = `
      SELECT
        (SELECT COUNT(*)::int FROM districts) as total_districts,
        (SELECT COUNT(*)::int FROM divisions) as total_divisions,
        (SELECT COUNT(*)::int FROM foods WHERE is_published = true) as total_foods,
        (SELECT COUNT(*)::int FROM user_foods WHERE status = 'tried') as total_tried,
        (SELECT COUNT(DISTINCT user_id)::int FROM user_foods) as active_foodies
    `;
    const res = await query(sql);
    const r = res.rows[0] || {};
    return {
      totalDistricts: Number(r.total_districts || 64),
      totalDivisions: Number(r.total_divisions || 8),
      totalFoods: Number(r.total_foods || 0),
      totalTriedByUsers: Number(r.total_tried || 0),
      activeFoodiesCount: Number(r.active_foodies || 0)
    };
  }
  async getAdminOverview() {
    const sql = `
      SELECT
        (SELECT COUNT(*)::int FROM foods) as total_foods,
        (SELECT COUNT(*)::int FROM foods WHERE is_published = true) as published_foods,
        (SELECT COUNT(*)::int FROM foods WHERE is_published = false) as draft_foods,
        (SELECT COUNT(DISTINCT district_id)::int FROM foods WHERE is_published = true) as districts_covered,
        (SELECT COUNT(*)::int FROM profiles) as total_users,
        (SELECT COUNT(*)::int FROM food_reviews) as total_reviews,
        (SELECT COUNT(*)::int FROM food_submissions WHERE status = 'pending') as pending_submissions,
        (SELECT COUNT(*)::int FROM food_submissions) as total_submissions,
        (SELECT COUNT(*)::int FROM reports WHERE status = 'pending') as total_reports
    `;
    const res = await query(sql);
    const r = res.rows[0] || {};
    return {
      totalFoods: Number(r.total_foods || 0),
      publishedFoods: Number(r.published_foods || 0),
      draftFoods: Number(r.draft_foods || 0),
      totalDistrictsCovered: Number(r.districts_covered || 0),
      totalUsers: Number(r.total_users || 0),
      totalReviews: Number(r.total_reviews || 0),
      pendingSubmissionsCount: Number(r.pending_submissions || 0),
      totalSubmissionsCount: Number(r.total_submissions || 0),
      totalReportsCount: Number(r.total_reports || 0)
    };
  }
};
var postgresDal = new PostgresDataAccessLayer();

// server/dal.ts
function isPostgresActive() {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}
function validateDatabaseConfig() {
  const isProd = process.env.NODE_ENV === "production";
  const hasDbUrl = isPostgresActive();
  if (isProd && !hasDbUrl) {
    throw new Error(
      "[DATABASE FATAL]: Production environment requires a valid DATABASE_URL connecting to Supabase PostgreSQL. Local JSON persistence fallback is strictly prohibited in production."
    );
  }
}
var JsonDataAccessLayer = class {
  async getDivisions() {
    return db.getSchema().divisions;
  }
  async getDistricts() {
    const schema = db.getSchema();
    return schema.districts.map((d) => ({
      ...d,
      foodsCount: schema.foods.filter((f) => f.districtId === d.id && f.isPublished).length
    }));
  }
  async getDistrictById(id) {
    const schema = db.getSchema();
    const d = schema.districts.find((x) => x.id === id);
    if (!d) return null;
    return {
      ...d,
      foodsCount: schema.foods.filter((f) => f.districtId === d.id && f.isPublished).length
    };
  }
  async getCategories() {
    return db.getSchema().categories;
  }
  async getUserById(id) {
    return db.getSchema().users.find((u) => u.id === id) || null;
  }
  async getUserByEmail(email) {
    const clean = email.trim().toLowerCase();
    return db.getSchema().users.find((u) => u.email.toLowerCase() === clean) || null;
  }
  async getAllUsers() {
    return db.getSchema().users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl,
      homeDistrictId: u.homeDistrictId,
      bio: u.bio,
      createdAt: u.createdAt
    }));
  }
  async hasAdmin() {
    return db.getSchema().users.some((u) => u.role === "admin");
  }
  async createUser(user) {
    db.getSchema().users.push(user);
    db.save();
    return user;
  }
  async updateUserProfile(id, updates) {
    const user = db.getSchema().users.find((u) => u.id === id);
    if (!user) throw new Error("User not found.");
    if (updates.name !== void 0) user.name = updates.name.trim();
    if (updates.avatarUrl !== void 0) user.avatarUrl = updates.avatarUrl.trim() || void 0;
    if (updates.homeDistrictId !== void 0) user.homeDistrictId = updates.homeDistrictId || void 0;
    if (updates.bio !== void 0) user.bio = updates.bio.trim() || void 0;
    db.save();
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      homeDistrictId: user.homeDistrictId,
      bio: user.bio,
      createdAt: user.createdAt
    };
  }
  async updateUserPassword(id, passwordHash, salt) {
    const user = db.getSchema().users.find((u) => u.id === id);
    if (!user) return false;
    user.passwordHash = passwordHash;
    user.salt = salt;
    db.save();
    return true;
  }
  async updateUserRole(id, role) {
    const user = db.getSchema().users.find((u) => u.id === id);
    if (!user) throw new Error("User not found.");
    if (user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() && role !== "admin") {
      throw new Error("Primary administrator role cannot be downgraded.");
    }
    user.role = role;
    db.save();
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      homeDistrictId: user.homeDistrictId,
      bio: user.bio,
      createdAt: user.createdAt
    };
  }
  async getFoods(options = {}) {
    let list = db.getSchema().foods;
    if (!options.includeDrafts) {
      list = list.filter((f) => f.isPublished);
    }
    if (options.divisionId && options.divisionId !== "all") {
      list = list.filter((f) => f.divisionId === options.divisionId);
    }
    if (options.districtId && options.districtId !== "all") {
      list = list.filter((f) => f.districtId === options.districtId);
    }
    if (options.category && options.category !== "all") {
      list = list.filter((f) => f.category === options.category);
    }
    if (options.dietary && options.dietary !== "all") {
      list = list.filter((f) => f.dietaryType === options.dietary);
    }
    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(
        (f) => f.nameEn.toLowerCase().includes(q) || f.nameBn.includes(q) || f.shortDescription.toLowerCase().includes(q)
      );
    }
    return list;
  }
  async getFoodById(id) {
    return db.getSchema().foods.find((f) => f.id === id) || null;
  }
  async createFood(food) {
    db.getSchema().foods.unshift(food);
    db.save();
    return food;
  }
  async updateFood(id, updates) {
    const list = db.getSchema().foods;
    const idx = list.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error("Food not found.");
    list[idx] = {
      ...list[idx],
      ...updates,
      id: list[idx].id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.save();
    return list[idx];
  }
  async togglePublishFood(id, isPublished) {
    return this.updateFood(id, { isPublished });
  }
  async deleteFood(id) {
    const schema = db.getSchema();
    const lenBefore = schema.foods.length;
    schema.foods = schema.foods.filter((f) => f.id !== id);
    db.save();
    return schema.foods.length < lenBefore;
  }
  async getSubmissions(options = {}) {
    let list = db.getSchema().foodSubmissions || [];
    if (options.userId) {
      list = list.filter((s) => s.userId === options.userId);
    }
    if (options.status && options.status !== "all") {
      list = list.filter((s) => s.status === options.status);
    }
    if (options.districtId && options.districtId !== "all") {
      list = list.filter((s) => s.districtId === options.districtId);
    }
    return list;
  }
  async getSubmissionById(id) {
    const list = db.getSchema().foodSubmissions || [];
    return list.find((s) => s.id === id) || null;
  }
  async createSubmission(sub) {
    const schema = db.getSchema();
    schema.foodSubmissions = schema.foodSubmissions || [];
    schema.foodSubmissions.unshift(sub);
    db.save();
    return sub;
  }
  async updateSubmission(id, updates) {
    const schema = db.getSchema();
    schema.foodSubmissions = schema.foodSubmissions || [];
    const idx = schema.foodSubmissions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Submission not found.");
    schema.foodSubmissions[idx] = {
      ...schema.foodSubmissions[idx],
      ...updates,
      id: schema.foodSubmissions[idx].id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.save();
    return schema.foodSubmissions[idx];
  }
  async reviewSubmission(id, review) {
    return this.updateSubmission(id, {
      status: review.status,
      reviewedByUserId: review.reviewedByUserId,
      reviewedByUserName: review.reviewedByUserName,
      reviewedAt: (/* @__PURE__ */ new Date()).toISOString(),
      adminFeedback: review.adminFeedback,
      approvedFoodId: review.approvedFoodId
    });
  }
  async getUserFoods(userId) {
    const list = db.getSchema().userFoods || [];
    return list.filter((uf) => uf.userId === userId);
  }
  async getUserFood(userId, foodId) {
    const list = db.getSchema().userFoods || [];
    return list.find((uf) => uf.userId === userId && uf.foodId === foodId) || null;
  }
  async upsertUserFood(tracking) {
    const schema = db.getSchema();
    schema.userFoods = schema.userFoods || [];
    const idx = schema.userFoods.findIndex(
      (uf) => uf.userId === tracking.userId && uf.foodId === tracking.foodId
    );
    if (idx >= 0) {
      schema.userFoods[idx] = {
        ...schema.userFoods[idx],
        ...tracking,
        id: schema.userFoods[idx].id,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      db.save();
      return schema.userFoods[idx];
    } else {
      schema.userFoods.push(tracking);
      db.save();
      return tracking;
    }
  }
  async deleteUserFood(userId, foodId) {
    const schema = db.getSchema();
    schema.userFoods = schema.userFoods || [];
    const lenBefore = schema.userFoods.length;
    schema.userFoods = schema.userFoods.filter(
      (uf) => !(uf.userId === userId && uf.foodId === foodId)
    );
    db.save();
    return schema.userFoods.length < lenBefore;
  }
  async getReviews(foodId) {
    let list = db.getSchema().foodReviews || [];
    if (foodId) {
      list = list.filter((r) => r.foodId === foodId);
    }
    return list;
  }
  async getReviewById(id) {
    const list = db.getSchema().foodReviews || [];
    return list.find((r) => r.id === id) || null;
  }
  async createReview(review) {
    const schema = db.getSchema();
    schema.foodReviews = schema.foodReviews || [];
    schema.foodReviews.unshift(review);
    db.save();
    return review;
  }
  async deleteReview(id) {
    const schema = db.getSchema();
    schema.foodReviews = schema.foodReviews || [];
    const lenBefore = schema.foodReviews.length;
    schema.foodReviews = schema.foodReviews.filter((r) => r.id !== id);
    db.save();
    return schema.foodReviews.length < lenBefore;
  }
  async getAchievements() {
    return db.getSchema().achievements || [];
  }
  async getReports() {
    return db.getSchema().reports || [];
  }
  async createReport(report) {
    const schema = db.getSchema();
    schema.reports = schema.reports || [];
    schema.reports.unshift(report);
    db.save();
    return report;
  }
  async updateReportStatus(id, status) {
    const schema = db.getSchema();
    schema.reports = schema.reports || [];
    const item = schema.reports.find((r) => r.id === id);
    if (!item) throw new Error("Report not found.");
    item.status = status;
    db.save();
    return item;
  }
  async getAuditLogs(limit = 50) {
    const list = db.getSchema().auditLogs || [];
    return list.slice(0, limit);
  }
  async logAudit(log) {
    const entry = {
      ...log,
      id: "audit_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const schema = db.getSchema();
    schema.auditLogs = schema.auditLogs || [];
    schema.auditLogs.unshift(entry);
    db.save();
    return entry;
  }
  async getPlatformStats() {
    const schema = db.getSchema();
    const userFoods = schema.userFoods || [];
    const activeFoodies = new Set(userFoods.map((uf) => uf.userId));
    return {
      totalDistricts: schema.districts.length,
      totalDivisions: schema.divisions.length,
      totalFoods: schema.foods.filter((f) => f.isPublished).length,
      totalTriedByUsers: userFoods.filter((uf) => uf.status === "tried").length,
      activeFoodiesCount: activeFoodies.size
    };
  }
  async getAdminOverview() {
    const schema = db.getSchema();
    const foods = schema.foods;
    const published = foods.filter((f) => f.isPublished);
    const drafts = foods.filter((f) => !f.isPublished);
    const coveredDistricts = new Set(published.map((f) => f.districtId));
    const submissions = schema.foodSubmissions || [];
    return {
      totalFoods: foods.length,
      publishedFoods: published.length,
      draftFoods: drafts.length,
      totalDistrictsCovered: coveredDistricts.size,
      totalUsers: schema.users.length,
      totalReviews: (schema.foodReviews || []).length,
      pendingSubmissionsCount: submissions.filter((s) => s.status === "pending").length,
      totalSubmissionsCount: submissions.length,
      totalReportsCount: (schema.reports || []).length
    };
  }
};
var jsonDal = new JsonDataAccessLayer();
var UnifiedDataAccessLayer = class {
  get backend() {
    if (isPostgresActive()) {
      return postgresDal;
    }
    return jsonDal;
  }
  get activeProvider() {
    return isPostgresActive() ? "supabase_postgres" : "local_json";
  }
  // Divisions & Districts & Categories
  async getDivisions() {
    return this.backend.getDivisions();
  }
  async getDistricts() {
    return this.backend.getDistricts();
  }
  async getDistrictById(id) {
    return this.backend.getDistrictById(id);
  }
  async getCategories() {
    return this.backend.getCategories();
  }
  // Users & Auth
  async getUserById(id) {
    return this.backend.getUserById(id);
  }
  async getUserByEmail(email) {
    return this.backend.getUserByEmail(email);
  }
  async getAllUsers() {
    return this.backend.getAllUsers();
  }
  async hasAdmin() {
    return this.backend.hasAdmin();
  }
  async createUser(user) {
    return this.backend.createUser(user);
  }
  async updateUserProfile(id, updates) {
    return this.backend.updateUserProfile(id, updates);
  }
  async updateUserPassword(id, passwordHash, salt) {
    return this.backend.updateUserPassword(id, passwordHash, salt);
  }
  async updateUserRole(id, role) {
    return this.backend.updateUserRole(id, role);
  }
  // Foods
  async getFoods(options) {
    return this.backend.getFoods(options);
  }
  async getFoodById(id) {
    return this.backend.getFoodById(id);
  }
  async createFood(food) {
    return this.backend.createFood(food);
  }
  async updateFood(id, updates) {
    return this.backend.updateFood(id, updates);
  }
  async togglePublishFood(id, isPublished) {
    return this.backend.togglePublishFood(id, isPublished);
  }
  async deleteFood(id) {
    return this.backend.deleteFood(id);
  }
  // Food Submissions
  async getSubmissions(options) {
    return this.backend.getSubmissions(options);
  }
  async getSubmissionById(id) {
    return this.backend.getSubmissionById(id);
  }
  async createSubmission(sub) {
    return this.backend.createSubmission(sub);
  }
  async updateSubmission(id, updates) {
    return this.backend.updateSubmission(id, updates);
  }
  async reviewSubmission(id, review) {
    return this.backend.reviewSubmission(id, review);
  }
  // User Foods (Journey)
  async getUserFoods(userId) {
    return this.backend.getUserFoods(userId);
  }
  async getUserFood(userId, foodId) {
    return this.backend.getUserFood(userId, foodId);
  }
  async upsertUserFood(tracking) {
    return this.backend.upsertUserFood(tracking);
  }
  async deleteUserFood(userId, foodId) {
    return this.backend.deleteUserFood(userId, foodId);
  }
  // Reviews
  async getReviews(foodId) {
    return this.backend.getReviews(foodId);
  }
  async getReviewById(id) {
    return this.backend.getReviewById(id);
  }
  async createReview(review) {
    return this.backend.createReview(review);
  }
  async deleteReview(id) {
    return this.backend.deleteReview(id);
  }
  // Achievements
  async getAchievements() {
    return this.backend.getAchievements();
  }
  // Reports
  async getReports() {
    return this.backend.getReports();
  }
  async createReport(report) {
    return this.backend.createReport(report);
  }
  async updateReportStatus(id, status) {
    return this.backend.updateReportStatus(id, status);
  }
  // Audit Logs
  async getAuditLogs(limit) {
    return this.backend.getAuditLogs(limit);
  }
  async logAudit(log) {
    return this.backend.logAudit(log);
  }
  // Stats & Overview
  async getPlatformStats() {
    return this.backend.getPlatformStats();
  }
  async getAdminOverview() {
    return this.backend.getAdminOverview();
  }
};
var dal = new UnifiedDataAccessLayer();

// server/auth.ts
import "dotenv/config";
import crypto2 from "crypto";
var DISALLOWED_PRODUCTION_SECRETS = [
  "foodie-bd-sha256-super-secret-key-2026",
  "secret",
  "changeme",
  "jwt_secret",
  "default",
  "password"
];
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    if (!secret || typeof secret !== "string" || secret.trim().length < 32) {
      throw new Error(
        "[SECURITY FATAL]: Production environment requires a strong, random JWT_SECRET containing at least 32 characters."
      );
    }
    if (DISALLOWED_PRODUCTION_SECRETS.includes(secret.trim().toLowerCase())) {
      throw new Error(
        "[SECURITY FATAL]: Insecure default or placeholder JWT_SECRET is strictly forbidden in production."
      );
    }
    return secret.trim();
  }
  return secret?.trim() || "dev-only-local-secret-do-not-use-in-production-32chars!";
}
function validateAuthConfig() {
  getJwtSecret();
}
function generateToken(user) {
  const secret = getJwtSecret();
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1e3),
    exp: Math.floor(Date.now() / 1e3) + 7 * 24 * 60 * 60
    // 7 days
  };
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto2.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}
function verifyToken(token) {
  try {
    const secret = getJwtSecret();
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto2.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto2.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (payload.exp < Math.floor(Date.now() / 1e3)) return null;
    return payload;
  } catch {
    return null;
  }
}
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = void 0;
    return next();
  }
  const token = authHeader.substring(7).trim();
  const payload = verifyToken(token);
  if (!payload) {
    req.user = void 0;
    return next();
  }
  req.user = payload;
  next();
}
function requireAuth(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required. Please log in." });
    return;
  }
  next();
}
async function requireAdmin(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required. Please log in." });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Access denied. Administrator privileges required." });
    return;
  }
  try {
    const activeUser = await dal.getUserById(req.user.userId);
    if (!activeUser || activeUser.role !== "admin") {
      res.status(403).json({ error: "Access denied. Administrator privileges required." });
      return;
    }
  } catch {
    res.status(403).json({ error: "Access denied. Administrator privileges required." });
    return;
  }
  next();
}

// server/storage.ts
import "dotenv/config";
import fs2 from "fs";
import path2 from "path";
import crypto3 from "crypto";
import { createClient } from "@supabase/supabase-js";
var DATA_DIR2 = path2.resolve(process.cwd(), "data");
var UPLOADS_DIR = path2.join(DATA_DIR2, "uploads");
var MAX_FILE_SIZE = 5 * 1024 * 1024;
var DEFAULT_STORAGE_BUCKET = "food-images";
try {
  if (!fs2.existsSync(UPLOADS_DIR)) {
    fs2.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {
}
function validateImageBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      errorBn: "\u0995\u09CB\u09A8\u09CB \u0987\u09AE\u09C7\u099C \u09AB\u09BE\u0987\u09B2 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964",
      errorEn: "No image file payload provided."
    };
  }
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      isValid: false,
      errorBn: "\u099B\u09AC\u09BF\u09B0 \u0986\u0995\u09BE\u09B0 \u09B8\u09B0\u09CD\u09AC\u09CB\u099A\u09CD\u099A \u09EB \u09AE\u09C7\u0997\u09BE\u09AC\u09BE\u0987\u099F (5 MB) \u09B9\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u0964",
      errorEn: "File size exceeds the 5 MB limit."
    };
  }
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) {
    return {
      isValid: true,
      detectedMime: "image/jpeg",
      extension: "jpg"
    };
  }
  if (buffer.length >= 8 && buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71 && buffer[4] === 13 && buffer[5] === 10 && buffer[6] === 26 && buffer[7] === 10) {
    return {
      isValid: true,
      detectedMime: "image/png",
      extension: "png"
    };
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return {
      isValid: true,
      detectedMime: "image/webp",
      extension: "webp"
    };
  }
  return {
    isValid: false,
    errorBn: "\u09B6\u09C1\u09A7\u09C1\u09AE\u09BE\u09A4\u09CD\u09B0 JPG, PNG \u09AC\u09BE WebP \u09AB\u09B0\u09AE\u09CD\u09AF\u09BE\u099F\u09C7\u09B0 \u099B\u09AC\u09BF \u0986\u09AA\u09B2\u09CB\u09A1 \u0995\u09B0\u09BE \u09AF\u09BE\u09AC\u09C7\u0964",
    errorEn: "Only JPG, PNG, and WebP image formats are supported."
  };
}
var ImageStorageService = class {
  constructor() {
    this.supabase = null;
    this.uploadsDir = UPLOADS_DIR;
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET;
    this.initSupabaseClient();
  }
  initSupabaseClient() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey) {
      try {
        this.supabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false }
        });
      } catch (err) {
        console.error("[STORAGE WARNING]: Failed to initialize Supabase client:", err.message);
        this.supabase = null;
      }
    } else {
      this.supabase = null;
    }
  }
  /**
   * Returns current active storage provider name.
   */
  getStorageProviderName() {
    if (this.supabase) {
      return `Supabase Storage (bucket: ${this.bucketName})`;
    }
    return "Persistent Local Storage Engine (./data/uploads)";
  }
  /**
   * Tests reachability of the configured storage provider.
   */
  async testStorageConnection() {
    if (!this.supabase) {
      return {
        isAvailable: false,
        provider: "local",
        error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured."
      };
    }
    try {
      const bucketPromise = this.supabase.storage.getBucket(this.bucketName);
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Storage connection check timed out after 5s")), 5e3)
      );
      const { data, error } = await Promise.race([bucketPromise, timeoutPromise]);
      if (error) {
        return {
          isAvailable: false,
          provider: "supabase",
          bucket: this.bucketName,
          error: error.message
        };
      }
      return {
        isAvailable: true,
        provider: "supabase",
        bucket: data.name
      };
    } catch (err) {
      return {
        isAvailable: false,
        provider: "supabase",
        bucket: this.bucketName,
        error: err.message
      };
    }
  }
  /**
   * Idempotently ensures the public food-images storage bucket exists in Supabase.
   */
  async ensureBucketExists() {
    if (!this.supabase) {
      return { success: false, message: "Supabase client is not initialized." };
    }
    try {
      const { data, error } = await this.supabase.storage.getBucket(this.bucketName);
      if (data && !error) {
        return { success: true, created: false, message: `Bucket "${this.bucketName}" already exists.` };
      }
      const { data: createData, error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
      });
      if (createError) {
        return { success: false, message: `Failed to create bucket "${this.bucketName}": ${createError.message}` };
      }
      return { success: true, created: true, message: `Bucket "${this.bucketName}" created successfully with public access.` };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
  /**
   * Stores image buffer safely with binary signature validation and upload to Supabase Storage.
   */
  async saveImage(buffer, originalName, userId, prefix = "food") {
    const validation = validateImageBuffer(buffer);
    if (!validation.isValid) {
      throw new Error(validation.errorEn || "Invalid image file.");
    }
    const ext = validation.extension || "jpg";
    const randomHex = crypto3.randomBytes(8).toString("hex");
    const timestamp = Date.now();
    const safePrefix = prefix === "avatar" ? "avatar" : "food";
    const safeFileName = `${safePrefix}_${timestamp}_${randomHex}.${ext}`;
    const destinationPath = path2.join(this.uploadsDir, safeFileName);
    if (this.supabase) {
      try {
        const uploadPromise = this.supabase.storage.from(this.bucketName).upload(safeFileName, buffer, {
          contentType: validation.detectedMime || "image/jpeg",
          cacheControl: "31536000",
          upsert: false
        });
        const timeoutPromise = new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Supabase Storage upload timed out after 6s")), 6e3)
        );
        const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]);
        if (uploadError) {
          throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
        }
        const { data: publicUrlData } = this.supabase.storage.from(this.bucketName).getPublicUrl(safeFileName);
        await fs2.promises.writeFile(destinationPath, buffer).catch(() => {
        });
        return {
          storagePath: `${this.bucketName}/${safeFileName}`,
          url: publicUrlData.publicUrl,
          fileName: safeFileName,
          size: buffer.length,
          mimeType: validation.detectedMime || "image/jpeg",
          uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
          uploadedByUserId: userId
        };
      } catch (err) {
        if (process.env.NODE_ENV === "production") {
          throw new Error(`Production image upload failed: ${err.message}`);
        }
        console.warn("[STORAGE NOTICE]: Remote upload failed, falling back to local file:", err.message);
      }
    } else if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Supabase Storage is required in production. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      );
    }
    await fs2.promises.writeFile(destinationPath, buffer);
    const relativePath = path2.posix.join("uploads", safeFileName);
    const publicUrl = `/api/images/${safeFileName}`;
    return {
      storagePath: relativePath,
      url: publicUrl,
      fileName: safeFileName,
      size: buffer.length,
      mimeType: validation.detectedMime || "image/jpeg",
      uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
      uploadedByUserId: userId
    };
  }
  /**
   * Retrieves an image buffer and MIME type by filename.
   */
  async getImage(fileName) {
    const cleanName = path2.basename(fileName);
    const filePath = path2.join(this.uploadsDir, cleanName);
    if (fs2.existsSync(filePath)) {
      const buffer = await fs2.promises.readFile(filePath);
      const validation = validateImageBuffer(buffer);
      const mimeType = validation.detectedMime || "application/octet-stream";
      return { buffer, mimeType };
    }
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.storage.from(this.bucketName).download(cleanName);
        if (!error && data) {
          const arrayBuffer = await data.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const validation = validateImageBuffer(buffer);
          await fs2.promises.writeFile(filePath, buffer).catch(() => {
          });
          return {
            buffer,
            mimeType: validation.detectedMime || data.type || "image/jpeg"
          };
        }
      } catch {
        return null;
      }
    }
    return null;
  }
  /**
   * Safely deletes an uploaded file if requested.
   */
  async deleteImage(fileName) {
    const cleanName = path2.basename(fileName);
    const filePath = path2.join(this.uploadsDir, cleanName);
    let deleted = false;
    if (fs2.existsSync(filePath)) {
      try {
        await fs2.promises.unlink(filePath);
        deleted = true;
      } catch (err) {
        console.error("Error deleting local image file:", err);
      }
    }
    if (this.supabase) {
      try {
        const { error } = await this.supabase.storage.from(this.bucketName).remove([cleanName]);
        if (!error) deleted = true;
      } catch (err) {
        console.error("Error deleting remote image file from Supabase:", err);
      }
    }
    return deleted;
  }
  /**
   * Helper to check if a file exists locally or in Supabase bucket.
   */
  fileExists(fileName) {
    const cleanName = path2.basename(fileName);
    return fs2.existsSync(path2.join(this.uploadsDir, cleanName));
  }
};
var imageStorage = new ImageStorageService();

// src/lib/imageUrlHelper.ts
function normalizeFoodImageReference(rawRef) {
  if (typeof rawRef !== "string") return "";
  const trimmed = rawRef.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("uploads/")) {
    const filename = trimmed.slice("uploads/".length);
    return `/api/images/${filename}`;
  }
  if (trimmed.startsWith("food-images/")) {
    const filename = trimmed.slice("food-images/".length);
    return `/api/images/${filename}`;
  }
  if (/^(food|avatar)_[a-zA-Z0-9_\-\.]+\.(jpe?g|png|webp|gif|svg)$/i.test(trimmed)) {
    return `/api/images/${trimmed}`;
  }
  return trimmed;
}
function isValidFoodImageReference(imageRef) {
  if (typeof imageRef !== "string") return false;
  const rawTrimmed = imageRef.trim();
  if (!rawTrimmed) return false;
  if (rawTrimmed.startsWith("//") || rawTrimmed.includes("..") || rawTrimmed.includes("\\")) {
    return false;
  }
  if (/[\s\0\r\n]/.test(rawTrimmed)) {
    return false;
  }
  if (/^(javascript|data|file|vbscript|about):/i.test(rawTrimmed)) {
    return false;
  }
  const trimmed = normalizeFoodImageReference(rawTrimmed);
  if (trimmed.startsWith("/")) {
    const cleanPath = trimmed.split("?")[0].split("#")[0];
    if (cleanPath.startsWith("/api/images/")) {
      const fileName = cleanPath.slice("/api/images/".length);
      return /^[a-zA-Z0-9_\-\.]+\.(jpe?g|png|webp|gif|svg)$/i.test(fileName);
    }
    return /^\/[a-zA-Z0-9_\-\.\/]+\.(jpe?g|png|webp|gif|svg)$/i.test(cleanPath);
  }
  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }
    if (!parsed.hostname || parsed.hostname.length === 0) {
      return false;
    }
    if (parsed.username || parsed.password) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// server/data/verifiedDistrictResearch.ts
var VERIFIED_DISTRICT_RESEARCH = {
  gazipur: {
    districtId: "gazipur",
    districtNameEn: "Gazipur",
    districtNameBn: "\u0997\u09BE\u099C\u09C0\u09AA\u09C1\u09B0",
    divisionId: "dhaka",
    divisionNameEn: "Dhaka",
    foodNameEn: "Bhawal Kathal er Dalna & Kofta",
    foodNameBn: "\u09AD\u09BE\u0993\u09AF\u09BC\u09BE\u09B2\u09C7\u09B0 \u0995\u09BE\u0981\u09A0\u09BE\u09B2\u09C7\u09B0 \u09A1\u09BE\u09B2\u09A8\u09BE \u0993 \u0995\u09CB\u09AA\u09CD\u09A4\u09BE",
    category: "traditional",
    dietaryType: "veg",
    approximatePriceBdt: 140,
    shortDescriptionBn: "\u0997\u09BE\u099C\u09C0\u09AA\u09C1\u09B0\u09C7\u09B0 \u09AD\u09BE\u0993\u09AF\u09BC\u09BE\u09B2 \u0997\u09A1\u09BC\u09C7\u09B0 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u09B8\u09C1\u09AE\u09BF\u09B7\u09CD\u099F \u098F\u0981\u099A\u09CB\u09A1\u09BC (\u0995\u09BE\u0981\u099A\u09BE \u0995\u09BE\u0981\u09A0\u09BE\u09B2) \u09A6\u09BF\u09AF\u09BC\u09C7 \u09B0\u09BE\u09A8\u09CD\u09A8\u09BE \u0995\u09B0\u09BE \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09A1\u09BE\u09B2\u09A8\u09BE \u0993 \u0995\u09CB\u09AA\u09CD\u09A4\u09BE \u0995\u09BE\u09A1\u09BC\u09BF\u0964",
    shortDescriptionEn: "A savory heirloom curry crafted from tender young green jackfruit (enchor) harvested from the red soil orchards of Bhawal Estate.",
    detailedDescriptionBn: "\u09AD\u09BE\u0993\u09AF\u09BC\u09BE\u09B2 \u098F\u09B8\u09CD\u099F\u09C7\u099F \u0993 \u09B2\u09BE\u09B2 \u09AE\u09BE\u099F\u09BF\u09B0 \u0985\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u09B8\u09C1\u09AE\u09BF\u09B7\u09CD\u099F \u0995\u09BE\u0981\u09A0\u09BE\u09B2\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u0997\u09BE\u099C\u09C0\u09AA\u09C1\u09B0 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4\u0964 \u09AE\u09CC\u09B8\u09C1\u09AE\u09C7\u09B0 \u09B6\u09C1\u09B0\u09C1\u09A4\u09C7 \u0995\u099A\u09BF \u0995\u09BE\u0981\u099A\u09BE \u0995\u09BE\u0981\u09A0\u09BE\u09B2 (\u098F\u0981\u099A\u09CB\u09A1\u09BC) \u099B\u09CB\u099F \u099B\u09CB\u099F \u099F\u09C1\u0995\u09B0\u09CB \u0995\u09B0\u09C7 \u09B8\u09C7\u09A6\u09CD\u09A7 \u0995\u09B0\u09C7 \u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2, \u099C\u09BF\u09B0\u09C7 \u09AC\u09BE\u099F\u09BE \u0993 \u0997\u09B0\u09AE \u09AE\u09B6\u09B2\u09BE\u09AF\u09BC \u09AD\u09C1\u09A8\u09BE \u0995\u09B0\u09C7 \u09A4\u09C8\u09B0\u09BF \u09B9\u09AF\u09BC \u09A8\u09BF\u09B0\u09BE\u09AE\u09BF\u09B7 \u098F\u0981\u099A\u09CB\u09A1\u09BC\u09C7\u09B0 \u09A1\u09BE\u09B2\u09A8\u09BE\u0964 \u098F\u09B0 \u0995\u09CB\u09AA\u09CD\u09A4\u09BE \u0995\u09BE\u09A1\u09BC\u09BF\u0993 \u0990\u09A4\u09BF\u09B9\u09BE\u09B8\u09BF\u0995\u09AD\u09BE\u09AC\u09C7 \u09B8\u09AE\u09CD\u09AE\u09BE\u09A8\u09BF\u09A4 \u0985\u09A4\u09BF\u09A5\u09BF\u09A6\u09C7\u09B0 \u0986\u09AA\u09CD\u09AF\u09BE\u09AF\u09BC\u09A8\u09C7 \u09AA\u09B0\u09BF\u09AC\u09C7\u09B6\u09BF\u09A4 \u09B9\u09AF\u09BC\u0964",
    detailedDescriptionEn: "Gazipur, nestled on the red clay tract of Bhawal Pargana, is the jackfruit capital of Bangladesh. At the start of the season, tender green jackfruit (enchor) is boiled, tempered in cold-pressed mustard oil with bay leaves, cumin paste, and garam masala to make an earthy, meat-textured curry celebrated across rural Bengal.",
    ingredients: ["\u0995\u09BE\u0981\u099A\u09BE \u0995\u09BE\u0981\u09A0\u09BE\u09B2 / \u098F\u0981\u099A\u09CB\u09A1\u09BC (Green Jackfruit)", "\u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2 (Mustard Oil)", "\u099C\u09BF\u09B0\u09BE \u0993 \u09A7\u09A8\u09C7 \u09AC\u09BE\u099F\u09BE (Cumin & Coriander Paste)", "\u0986\u09A6\u09BE-\u09B0\u09B8\u09C1\u09A8 \u09AC\u09BE\u099F\u09BE (Ginger-Garlic Paste)", "\u0997\u09B0\u09AE \u09AE\u09B6\u09B2\u09BE (Garam Masala)"],
    preparationMethodEn: "Tender jackfruit is cubed, lightly boiled with turmeric, fried until golden, and simmered in a fragrant onion-cumin-garam masala gravy.",
    preparationMethodBn: "\u0995\u09BE\u0981\u099A\u09BE \u0995\u09BE\u0981\u09A0\u09BE\u09B2\u09C7\u09B0 \u0996\u09CB\u09B8\u09BE \u099B\u09BE\u09A1\u09BC\u09BF\u09AF\u09BC\u09C7 \u099F\u09C1\u0995\u09B0\u09CB \u0995\u09B0\u09C7 \u09B9\u09B2\u09C1\u09A6-\u09B2\u09AC\u09A3\u09C7 \u09B9\u09BE\u09B2\u0995\u09BE \u09B8\u09C7\u09A6\u09CD\u09A7 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964 \u098F\u09B0\u09AA\u09B0 \u09A4\u09C7\u09B2\u09C7 \u09AD\u09C7\u099C\u09C7 \u09AE\u09B6\u09B2\u09BE\u09B0 \u0995\u09B7\u09BE\u09A8\u09CB \u099D\u09CB\u09B2\u09C7 \u09AB\u09C1\u099F\u09BF\u09AF\u09BC\u09C7 \u09AE\u09BE\u0996\u09BE \u09AE\u09BE\u0996\u09BE \u09A4\u09B0\u0995\u09BE\u09B0\u09BF \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented in Bhawal Zamindar culinary archives and Gazipur District Administration agriculture studies as the premier regional agrarian delicacy.",
    historicalContextBn: "\u09AD\u09BE\u0993\u09AF\u09BC\u09BE\u09B2 \u09AA\u09B0\u0997\u09A8\u09BE\u09B0 \u09B2\u09BE\u09B2 \u09AE\u09BE\u099F\u09BF\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0995\u09C3\u09B7\u09BF\u099C \u09B8\u09AE\u09CD\u09AA\u09A6 \u0993 \u09B2\u09CB\u0995\u09B8\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF\u09A4\u09C7 \u0995\u09BE\u0981\u09A0\u09BE\u09B2\u09C7\u09B0 \u09AC\u09BF\u09AD\u09BF\u09A8\u09CD\u09A8 \u09AA\u09A6\u09C7\u09B0 \u0989\u09B2\u09CD\u09B2\u09C7\u0996 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u0964",
    primarySource: "Gazipur District Administration Agrarian Heritage Studies",
    citationSources: [
      "Gazipur District Administration Portal (Cultural Section)",
      "Bangladesh Department of Agricultural Extension (DAE) Gazipur Agro-Profile",
      "Banglapedia: Bhawal Pargana and Regional Flora"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Tender raw green jackfruit curry (enchorer dalna) served in a terracotta bowl with steamed fragrant white rice.",
    imageAttribution: "Regional Culinary Heritage Archive"
  },
  narayanganj: {
    districtId: "narayanganj",
    districtNameEn: "Narayanganj",
    districtNameBn: "\u09A8\u09BE\u09B0\u09BE\u09DF\u09A3\u0997\u099E\u09CD\u099C",
    divisionId: "dhaka",
    divisionNameEn: "Dhaka",
    foodNameEn: "Pran Bhallabh er Doi & Sonargaon Murabba",
    foodNameBn: "\u09AA\u09CD\u09B0\u09BE\u09A3 \u09AC\u09B2\u09CD\u09B2\u09AD\u09C7\u09B0 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09A6\u09A7\u09BF \u0993 \u09B8\u09CB\u09A8\u09BE\u09B0\u0997\u09BE\u0981\u09AF\u09BC\u09C7\u09B0 \u09AE\u09CB\u09B0\u09AC\u09CD\u09AC\u09BE",
    category: "dessert",
    dietaryType: "sweet",
    approximatePriceBdt: 220,
    shortDescriptionBn: "\u09B8\u09BF\u09A6\u09CD\u09A7\u09BF\u09B0\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AA\u09CD\u09B0\u09BE\u09A3 \u09AC\u09B2\u09CD\u09B2\u09AD \u0998\u09CB\u09B7\u09C7\u09B0 \u09ED \u09A6\u09B6\u0995 \u09AA\u09C1\u09B0\u09CB\u09A8\u09CB \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09A6\u0987 \u0993 \u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8 \u09B0\u09BE\u099C\u09A7\u09BE\u09A8\u09C0 \u09B8\u09CB\u09A8\u09BE\u09B0\u0997\u09BE\u0981\u09AF\u09BC\u09C7\u09B0 \u09AB\u09B2\u099C\u09BE\u09A4 \u09AE\u09CB\u09B0\u09AC\u09CD\u09AC\u09BE\u0964",
    shortDescriptionEn: "Heritage sweet curd crafted for over 70 years by Pran Bhallabh Ghosh in Siddhirganj alongside traditional Sonargaon fruit preserves.",
    detailedDescriptionBn: "\u09A8\u09BE\u09B0\u09BE\u09AF\u09BC\u09A3\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u09AC\u09A8\u09CD\u09A6\u09B0 \u0993 \u09AC\u09BE\u09A3\u09BF\u099C\u09CD\u09AF\u09BF\u0995 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8 \u099C\u09A8\u09AA\u09A6\u09C7 \u09B8\u09BF\u09A6\u09CD\u09A7\u09BF\u09B0\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u09AA\u09CD\u09B0\u09BE\u09A3 \u09AC\u09B2\u09CD\u09B2\u09AD\u09C7\u09B0 \u09A6\u0987 \u0985\u09A4\u09CD\u09AF\u09A8\u09CD\u09A4 \u09B8\u09C1\u09AA\u09B0\u09BF\u099A\u09BF\u09A4\u0964 \u09AC\u09BF\u09B6\u09C1\u09A6\u09CD\u09A7 \u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7 \u09AE\u09BE\u099F\u09BF\u09B0 \u09AA\u09BE\u09A4\u09BF\u09B2\u09C7 \u09A6\u09C0\u09B0\u09CD\u0998\u0995\u09CD\u09B7\u09A3 \u099C\u09CD\u09AC\u09BE\u09B2 \u09A6\u09BF\u09AF\u09BC\u09C7 \u098F\u0987 \u09A6\u0987 \u099C\u09AE\u09BE\u09A8\u09CB \u09B9\u09AF\u09BC\u0964 \u098F\u099B\u09BE\u09A1\u09BC\u09BE \u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8 \u09AC\u09BE\u0982\u09B2\u09BE\u09B0 \u09B0\u09BE\u099C\u09A7\u09BE\u09A8\u09C0 \u09B8\u09CB\u09A8\u09BE\u09B0\u0997\u09BE\u0981\u09AF\u09BC\u09C7\u09B0 \u099A\u09BE\u09B2\u0995\u09C1\u09AE\u09A1\u09BC\u09BE \u0993 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09AB\u09B2\u09C7\u09B0 \u09AE\u09CB\u09B0\u09AC\u09CD\u09AC\u09BE \u09B8\u09C1\u09B2\u09A4\u09BE\u09A8\u09BF \u0986\u09AE\u09B2 \u09A5\u09C7\u0995\u09C7\u0987 \u09B8\u09AE\u09BE\u09A6\u09C3\u09A4\u0964",
    detailedDescriptionEn: "Pran Bhallabh Ghosh established this celebrated confectionery in Siddhirganj over 70 years ago. Pure cow milk is reduced over slow wood-fired kilns and cultured in porous unglazed earthenware pots. Alongside, Sonargaon preservation traditions of winter-melon and citrus murabbas date back to the medieval capital period.",
    ingredients: ["\u0996\u09BE\u0981\u099F\u09BF \u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7 (Pure Cow Milk)", "\u099A\u09BF\u09A8\u09BF\u09B0 \u09B6\u09BF\u09B0\u09BE (Sugar Syrup)", "\u09A6\u09A7\u09BF\u09B0 \u09AC\u09C0\u099C (Starter Culture)", "\u099A\u09BE\u09B2\u0995\u09C1\u09AE\u09A1\u09BC\u09BE (Winter Melon)"],
    preparationMethodEn: "Milk is simmered over clay ovens, gently sweetened, poured into porous clay bowls, and covered in warm blankets to ferment overnight.",
    preparationMethodBn: "\u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7 \u099C\u09CD\u09AC\u09BE\u09B2 \u09A6\u09BF\u09DF\u09C7 \u0998\u09A8 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC, \u0996\u09BE\u0981\u099F\u09BF \u099A\u09BF\u09A8\u09BF \u09AE\u09BF\u09B6\u09BF\u09DF\u09C7 \u09AE\u09BE\u099F\u09BF\u09B0 \u09AA\u09BE\u09A4\u09BF\u09B2\u09C7 \u09A2\u09C7\u09B2\u09C7 \u09AC\u09C0\u099C \u09A6\u0987 \u09A6\u09BF\u09DF\u09C7 \u09A2\u09C7\u0995\u09C7 \u09B8\u09BE\u09B0\u09BE\u09B0\u09BE\u09A4 \u09A4\u09BE\u09AA\u09C7 \u09B0\u09BE\u0996\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Featured in regional gastronomic documentation and established culinary journalism as Narayanganj\u2019s most authentic local confectionery.",
    historicalContextBn: "\u09B8\u09BF\u09A6\u09CD\u09A7\u09BF\u09B0\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u09AA\u09CD\u09B0\u09BE\u09A3 \u09AC\u09B2\u09CD\u09B2\u09AD\u09C7\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09AA\u09CD\u09B0\u09A4\u09BF\u09B7\u09CD\u09A0\u09BE\u09A8 \u098F\u09AC\u0982 \u09B8\u09CB\u09A8\u09BE\u09B0\u0997\u09BE\u0981 \u09B2\u09CB\u0995 \u0993 \u0995\u09BE\u09B0\u09C1\u09B6\u09BF\u09B2\u09CD\u09AA \u09AB\u09BE\u0989\u09A8\u09CD\u09A1\u09C7\u09B6\u09A8\u09C7\u09B0 \u09A8\u09A5\u09BF\u09AD\u09C1\u0995\u09CD\u09A4 \u09B8\u09CD\u09A5\u09BE\u09A8\u09C0\u09AF\u09BC \u09B0\u09A8\u09CD\u09A7\u09A8\u09B6\u09C8\u09B2\u09C0\u0964",
    primarySource: "Narayanganj District Gazetteer & Culinary Chronicle",
    citationSources: [
      "The Financial Express (Bangladesh): 73-year tradition of Pran Bhallabh Confectionery",
      "Sonargaon Folk Arts and Crafts Foundation Documentation",
      "Narayanganj District Administration Cultural Affairs"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Traditional Bengali sweet curd in a small earthenware bowl next to translucent candied winter melon murabba.",
    imageAttribution: "Narayanganj Heritage Confectionery Archives"
  },
  narsingdi: {
    districtId: "narsingdi",
    districtNameEn: "Narsingdi",
    districtNameBn: "\u09A8\u09B0\u09B8\u09BF\u0982\u09A6\u09C0",
    divisionId: "dhaka",
    divisionNameEn: "Dhaka",
    foodNameEn: "Narsingdi Amrit Sagar Kola & Badshabhog",
    foodNameBn: "\u09A8\u09B0\u09B8\u09BF\u0982\u09A6\u09C0\u09B0 \u0985\u09AE\u09C3\u09A4\u09B8\u09BE\u0997\u09B0 \u0995\u09B2\u09BE \u0993 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AC\u09BE\u09A6\u09B6\u09BE\u09B9\u09AD\u09CB\u0997",
    category: "dessert",
    dietaryType: "sweet",
    approximatePriceBdt: 120,
    shortDescriptionBn: "\u09A8\u09B0\u09B8\u09BF\u0982\u09A6\u09C0\u09B0 \u099C\u09BF\u0986\u0987 \u09B8\u09A8\u09A6\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09B8\u09C1\u0997\u09A8\u09CD\u09A7\u09BF \u0985\u09AE\u09C3\u09A4\u09B8\u09BE\u0997\u09B0 \u0995\u09B2\u09BE \u098F\u09AC\u0982 \u09B6\u09A4\u09AC\u09B0\u09CD\u09B7\u09C0 \u09AC\u09BE\u09A6\u09B6\u09BE\u09B9\u09AD\u09CB\u0997 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8\u0964",
    shortDescriptionEn: "GI-certified heirloom Amrit Sagar banana, historically savored by the Nawabs of Dhaka, served with traditional Badshabhog sweets.",
    detailedDescriptionBn: "\u09A8\u09B0\u09B8\u09BF\u0982\u09A6\u09C0\u09B0 \u09A8\u09A6\u09C0\u09AC\u09BF\u09A7\u09CC\u09A4 \u0989\u09B0\u09CD\u09AC\u09B0 \u09AA\u09B2\u09BF\u09AE\u09BE\u099F\u09BF\u09B0 \u099C\u09A8\u09CD\u09AF \u0985\u09AE\u09C3\u09A4\u09B8\u09BE\u0997\u09B0 \u0995\u09B2\u09BE \u09A4\u09BE\u09B0 \u0985\u09A8\u09A8\u09CD\u09AF \u09B8\u09C1\u09AC\u09BE\u09B8, \u09AE\u09B8\u09C3\u09A3 \u09B6\u09BE\u0981\u09B8 \u0993 \u09A4\u09C0\u09AC\u09CD\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF\u09B0 \u099C\u09A8\u09CD\u09AF \u09AC\u09BF\u09B6\u09CD\u09AC\u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4\u0964 \u098F\u099F\u09BF \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6 \u09B8\u09B0\u0995\u09BE\u09B0\u09C7\u09B0 \u09AA\u09C7\u099F\u09C7\u09A8\u09CD\u099F\u09B8, \u09A1\u09BF\u099C\u09BE\u0987\u09A8 \u0993 \u099F\u09CD\u09B0\u09C7\u09A1\u09AE\u09BE\u09B0\u09CD\u0995 \u09AC\u09BF\u09AD\u09BE\u0997 (DPDT) \u0995\u09B0\u09CD\u09A4\u09C3\u0995 \u09AD\u09CC\u0997\u09CB\u09B2\u09BF\u0995 \u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6\u0995 (GI) \u09B8\u09A8\u09A6\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4\u0964 \u09B6\u09A4\u09AC\u09B0\u09CD\u09B7 \u09AA\u09C2\u09B0\u09CD\u09AC\u09C7 \u09A2\u09BE\u0995\u09BE\u09B0 \u09A8\u09AC\u09BE\u09AC\u09A6\u09C7\u09B0 \u09AC\u09BF\u09B6\u09C7\u09B7 \u09AA\u099B\u09A8\u09CD\u09A6\u09C7\u09B0 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE\u09AF\u09BC \u099B\u09BF\u09B2 \u098F\u0987 \u0995\u09B2\u09BE\u0964",
    detailedDescriptionEn: "Narsingdi\u2019s alluvial Meghna soil produces the legendary Amrit Sagar banana, granted official Geographical Indication (GI) status in February 2024. Prized for its buttery, fiberless texture and sweet tropical aroma, it was historically patronized by the Nawabs of Dhaka alongside the century-old Badshabhog sweet of Shibpur.",
    ingredients: ["\u0985\u09AE\u09C3\u09A4\u09B8\u09BE\u0997\u09B0 \u0995\u09B2\u09BE (Amrit Sagar Banana)", "\u0996\u09BE\u0981\u099F\u09BF \u099B\u09BE\u09A8\u09BE (Fresh Chhana)", "\u099A\u09BF\u09A8\u09BF\u09B0 \u09B6\u09BF\u09B0\u09BE (Sugar Syrup)", "\u098F\u09B2\u09BE\u099A (Cardamom)"],
    preparationMethodEn: "Bananas are naturally ripened using traditional smoke-curing; the paired Badshabhog is kneaded from pure cow-milk chhana and boiled in thin aromatic cardamom syrup.",
    preparationMethodBn: "\u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995 \u0989\u09AA\u09BE\u09DF\u09C7 \u0995\u09B2\u09BE \u09AA\u09BE\u0995\u09BE\u09A8\u09CB \u09B9\u09AF\u09BC \u098F\u09AC\u0982 \u0996\u09BE\u0981\u099F\u09BF \u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7\u09C7\u09B0 \u099B\u09BE\u09A8\u09BE \u09AE\u09C7\u0996\u09C7 \u0997\u09CB\u09B2\u09BE\u09AA\u099C\u09B2 \u0993 \u098F\u09B2\u09BE\u099A\u09AE\u09BF\u09B6\u09CD\u09B0\u09BF\u09A4 \u09B9\u09BE\u09B2\u0995\u09BE \u099A\u09BF\u09A8\u09BF\u09B0 \u09B8\u09BF\u09B0\u09BE\u09AF\u09BC \u09AB\u09C1\u099F\u09BF\u09AF\u09BC\u09C7 \u09AC\u09BE\u09A6\u09B6\u09BE\u09B9\u09AD\u09CB\u0997 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Officially certified as Bangladesh Geographical Indication (GI) product in 2024. Patronized by Nawab Ahsanullah and documented in Dhaka division agricultural chronicles.",
    historicalContextBn: "\u09E8\u09E6\u09E8\u09EA \u09B8\u09BE\u09B2\u09C7\u09B0 \u09AB\u09C7\u09AC\u09CD\u09B0\u09C1\u09AF\u09BC\u09BE\u09B0\u09BF\u09A4\u09C7 \u09A8\u09B0\u09B8\u09BF\u0982\u09A6\u09C0\u09B0 \u0985\u09AE\u09C3\u09A4\u09B8\u09BE\u0997\u09B0 \u0995\u09B2\u09BE \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C7\u09B0 \u099C\u09BF\u0986\u0987 \u09AA\u09A3\u09CD\u09AF \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE\u09AD\u09C1\u0995\u09CD\u09A4 \u09B9\u09AF\u09BC\u0964",
    primarySource: "Department of Patents, Designs and Trademarks (DPDT) GI Registry #31",
    citationSources: [
      "Department of Patents, Designs and Trademarks (DPDT) GI Certification #31",
      "Bangladesh Department of Agricultural Extension (DAE) Horticulture Report",
      "Banglapedia: Agricultural Produce of Greater Dhaka"
    ],
    researchStatus: "gi_certified",
    isGiProduct: true,
    giRegistrationInfo: "Registered Geographical Indication Product under DPDT (Certificate #31)",
    imageSuggestionPrompt: "A bunch of bright yellow curved Amrit Sagar bananas on a green banana leaf beside delicate white spongy Badshabhog sweets.",
    imageAttribution: "Department of Agricultural Extension / Foodie BD Archive"
  },
  manikganj: {
    districtId: "manikganj",
    districtNameEn: "Manikganj",
    districtNameBn: "\u09AE\u09BE\u09A8\u09BF\u0995\u0997\u099E\u09CD\u099C",
    divisionId: "dhaka",
    divisionNameEn: "Dhaka",
    foodNameEn: "Manikganj Hazari Gur (Date Palm Jaggery)",
    foodNameBn: "\u09AE\u09BE\u09A8\u09BF\u0995\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09B9\u09BE\u099C\u09BE\u09B0\u09C0 \u0997\u09C1\u09A1\u09BC",
    category: "sweets_pitha",
    dietaryType: "sweet",
    approximatePriceBdt: 850,
    shortDescriptionBn: "\u09B9\u09BE\u09A4\u09C7 \u099A\u09BE\u09AA \u09A6\u09BF\u09B2\u09C7 \u0997\u09C1\u0981\u09DC\u09CB \u09B9\u09DF\u09C7 \u09AF\u09BE\u0993\u09DF\u09BE \u099C\u09BF\u0986\u0987 \u09B8\u09CD\u09AC\u09C0\u0995\u09C3\u09A4\u09BF\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4 \u09B9\u09B0\u09BF\u09B0\u09BE\u09AE\u09AA\u09C1\u09B0\u09C7\u09B0 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u09B6\u09C1\u09AD\u09CD\u09B0 \u0993 \u09B8\u09C1\u09AC\u09BE\u09B8\u09BF\u09A4 \u09B9\u09BE\u099C\u09BE\u09B0\u09C0 \u0997\u09C1\u09A1\u09BC\u0964",
    shortDescriptionEn: "Official GI-certified artisanal white date palm jaggery from Harirampur that delicately crumbles into powder upon gentle palm pressure.",
    detailedDescriptionBn: "\u09AE\u09BE\u09A8\u09BF\u0995\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u09B9\u09B0\u09BF\u09B0\u09BE\u09AE\u09AA\u09C1\u09B0 \u0989\u09AA\u099C\u09C7\u09B2\u09BE\u09B0 \u099D\u09BF\u099F\u0995\u09BE \u0985\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u09B9\u09BE\u099C\u09BE\u09B0\u09C0 \u0997\u09C1\u09A1\u09BC \u09AA\u09CD\u09B0\u09BE\u09AF\u09BC \u09A6\u09C1\u0987\u09B6\u09A4 \u09AC\u099B\u09B0\u09C7\u09B0 \u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8\u0964 \u09B8\u0995\u09BE\u09B2\u09C7 \u09B8\u0982\u0997\u09C3\u09B9\u09C0\u09A4 \u0996\u09BE\u0981\u099F\u09BF \u0996\u09C7\u099C\u09C1\u09B0\u09C7\u09B0 \u09B0\u09B8 \u09AC\u09BF\u09B6\u09C7\u09B7 \u0995\u09BE\u09A0\u09C7\u09B0 \u0995\u09BE\u09A0\u09BF \u09A6\u09BF\u09AF\u09BC\u09C7 \u0998\u09C1\u0981\u099F\u09C7 \u0993 \u09AE\u09BE\u099F\u09BF\u09B0 \u099A\u09C1\u09B2\u09BE\u09AF\u09BC \u09A8\u09BF\u0996\u09C1\u0981\u09A4 \u09A4\u09BE\u09AA\u09C7 \u099C\u09BE\u09B2 \u09A6\u09BF\u09AF\u09BC\u09C7 \u098F\u0987 \u09B9\u09BE\u09B2\u0995\u09BE \u09B8\u09BE\u09A6\u09BE\u099F\u09C7 \u09A6\u09BE\u09A8\u09BE\u09A6\u09BE\u09B0 \u0997\u09C1\u09A1\u09BC \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964 \u098F\u099F\u09BF \u09B9\u09BE\u09A4\u09C7 \u099A\u09BE\u09AA \u09A6\u09BF\u09B2\u09C7 \u0997\u09C1\u0981\u09A1\u09BC\u09CB \u09B9\u09AF\u09BC\u09C7 \u09AE\u09BF\u09B6\u09C7 \u09AF\u09BE\u09AF\u09BC\u0964 \u09E8\u09E6\u09E8\u09EA \u09B8\u09BE\u09B2\u09C7 \u098F\u099F\u09BF \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C7\u09B0 \u09EC\u09EA\u09A4\u09AE \u099C\u09BF\u0986\u0987 \u09AA\u09A3\u09CD\u09AF \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09B8\u09CD\u09AC\u09C0\u0995\u09C3\u09A4\u09BF \u09AA\u09BE\u09AF\u09BC\u0964",
    detailedDescriptionEn: "Manikganj Hazari Gur is an artisanal date palm jaggery dating back nearly two centuries to Hazari Pramanik in Jhitka, Harirampur. Made exclusively from dawn-tapped virgin date palm sap, it is hand-beaten during slow boiling until it crystallizes into a pale, crumbly disc. It holds official Geographical Indication (GI) certification #62.",
    ingredients: ["\u0996\u09BE\u0981\u099F\u09BF \u0996\u09C7\u099C\u09C1\u09B0\u09C7\u09B0 \u09B0\u09B8 (Pure Virgin Date Palm Sap)"],
    preparationMethodEn: "Dawn sap is strained through fine muslin into iron pans, gently simmered over tamarind-wood fires, and hand-beaten with a special wooden whisk until it cools and sets into pale crumbly discs.",
    preparationMethodBn: "\u09AD\u09CB\u09B0\u09C7\u09B0 \u09A4\u09BE\u099C\u09BE \u09B0\u09B8 \u09AA\u09BE\u09A4\u09B2\u09BE \u0995\u09BE\u09AA\u09A1\u09BC\u09C7 \u099B\u09C7\u0981\u0995\u09C7 \u0995\u09A1\u09BC\u09BE\u0987\u09A4\u09C7 \u099C\u09CD\u09AC\u09BE\u09B2 \u09A6\u09BF\u09AF\u09BC\u09C7 \u09A8\u09BF\u09B0\u09CD\u09A6\u09BF\u09B7\u09CD\u099F \u0998\u09A8\u09A4\u09CD\u09AC\u09C7\u09B0 \u09AA\u09B0 \u0995\u09BE\u09A0\u09C7\u09B0 \u09A1\u09BE\u09B2 \u09A6\u09BF\u09AF\u09BC\u09C7 \u0985\u09A8\u09AC\u09B0\u09A4 \u0998\u09C1\u0981\u099F\u09C7 \u0998\u09C1\u0981\u099F\u09C7 \u09A0\u09BE\u09A8\u09CD\u09A1\u09BE \u0995\u09B0\u09C7 \u099B\u09BE\u0981\u099A\u09C7 \u09AB\u09C7\u09B2\u09C7 \u09AA\u09BE\u09A4\u09B2\u09BE \u099A\u09BE\u0995\u09BE \u0997\u09C1\u09A1\u09BC \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Queen Elizabeth II was famously presented with Hazari Gur during her 1961 Royal tour of Dhaka and praised its floral aroma. Certified as Bangladesh GI #62.",
    historicalContextBn: "\u09E7\u09EF\u09EC\u09E7 \u09B8\u09BE\u09B2\u09C7 \u09B0\u09BE\u09A8\u09C0 \u09A6\u09CD\u09AC\u09BF\u09A4\u09C0\u09AF\u09BC \u098F\u09B2\u09BF\u099C\u09BE\u09AC\u09C7\u09A5 \u09A2\u09BE\u0995\u09BE \u09B8\u09AB\u09B0\u09C7 \u098F\u09B8\u09C7 \u098F\u0987 \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09B8\u09CD\u09AC\u09BE\u09A6 \u0993 \u09B8\u09C1\u09AC\u09BE\u09B8\u09C7\u09B0 \u09AD\u09C2\u09AF\u09BC\u09B8\u09C0 \u09AA\u09CD\u09B0\u09B6\u0982\u09B8\u09BE \u0995\u09B0\u09C7\u099B\u09BF\u09B2\u09C7\u09A8\u0964 \u09E8\u09E6\u09E8\u09EA \u09B8\u09BE\u09B2\u09C7 \u099C\u09BF\u0986\u0987 \u09B8\u09CD\u09AC\u09C0\u0995\u09C3\u09A4\u09BF \u09AA\u09BE\u09AF\u09BC\u0964",
    primarySource: "Department of Patents, Designs and Trademarks (DPDT) GI Registry #62",
    citationSources: [
      "DPDT GI Journal Registry #62 (Manikganj Hazari Gur)",
      "Manikganj District Administration Cultural Affairs Register",
      "The Financial Express: The 200-year sweet heritage of Jhitka Hazari Gur"
    ],
    researchStatus: "gi_certified",
    isGiProduct: true,
    giRegistrationInfo: "Registered Geographical Indication Product #62 (Ministry of Industries)",
    imageSuggestionPrompt: "Pale crumbly circular discs of authentic Manikganj Hazari Gur showing its dry, fine crystalline texture on a clay plate.",
    imageAttribution: "Manikganj District Administration / GI Registry Archives"
  },
  kishoreganj: {
    districtId: "kishoreganj",
    districtNameEn: "Kishoreganj",
    districtNameBn: "\u0995\u09BF\u09B6\u09CB\u09B0\u0997\u099E\u09CD\u099C",
    divisionId: "dhaka",
    divisionNameEn: "Dhaka",
    foodNameEn: "Ashtagram Artisanal Ponir (Haor Cheese)",
    foodNameBn: "\u0985\u09B7\u09CD\u099F\u0997\u09CD\u09B0\u09BE\u09AE\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0996\u09BE\u0981\u099F\u09BF \u09AA\u09A8\u09BF\u09B0",
    category: "traditional",
    dietaryType: "veg",
    approximatePriceBdt: 700,
    shortDescriptionBn: "\u09AE\u09C1\u0998\u09B2 \u0986\u09AE\u09B2 \u09A5\u09C7\u0995\u09C7 \u099A\u09B2\u09C7 \u0986\u09B8\u09BE \u0995\u09BF\u09B6\u09CB\u09B0\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u09B9\u09BE\u0993\u09B0\u09BE\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u09A6\u09C7\u09B6\u09BF \u0997\u09B0\u09C1 \u0993 \u09AE\u09B9\u09BF\u09B7\u09C7\u09B0 \u09A6\u09C1\u09A7\u09C7\u09B0 \u099C\u09BF\u0986\u0987 \u09B8\u09A8\u09A6\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4 \u09A8\u09CB\u09A8\u09A4\u09BE \u09AA\u09A8\u09BF\u09B0\u0964",
    shortDescriptionEn: "Mughal-era artisanal semi-hard white cheese handcrafted in the Ashtagram haor wetlands, certified with Geographical Indication (GI) status.",
    detailedDescriptionBn: "\u0995\u09BF\u09B6\u09CB\u09B0\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u0985\u09B7\u09CD\u099F\u0997\u09CD\u09B0\u09BE\u09AE\u09C7\u09B0 \u09AA\u09A8\u09BF\u09B0 \u09AA\u09CD\u09B0\u09BE\u09AF\u09BC \u09EA\u09E6\u09E6 \u09AC\u099B\u09B0\u09C7\u09B0 \u09AA\u09C1\u09B0\u09CB\u09A8\u09CB \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u0964 \u09AE\u09C1\u0998\u09B2 \u09B8\u09C1\u09AC\u09C7\u09A6\u09BE\u09B0\u09A6\u09C7\u09B0 \u0986\u09AE\u09B2\u09C7 \u098F\u09B0 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4 \u09AA\u09CD\u09B0\u09A3\u09BE\u09B2\u09C0 \u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0 \u09B2\u09BE\u09AD \u0995\u09B0\u09C7\u0964 \u09B9\u09BE\u0993\u09B0\u09C7\u09B0 \u0989\u09A8\u09CD\u09AE\u09C1\u0995\u09CD\u09A4 \u09AA\u09CD\u09B0\u09BE\u09A8\u09CD\u09A4\u09B0\u09C7 \u099A\u09B0\u09C7 \u09AC\u09C7\u09A1\u09BC\u09BE\u09A8\u09CB \u09A6\u09C7\u09B6\u09BF \u0997\u09BE\u09AD\u09C0 \u0993 \u09AE\u09B9\u09BF\u09B7\u09C7\u09B0 \u09AA\u09C2\u09B0\u09CD\u09A3 \u0998\u09A8 \u09A6\u09C1\u09A7 \u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995 \u09B0\u09C7\u09A8\u09C7\u099F \u09AC\u09BE \u0985\u09CD\u09AF\u09BE\u09B8\u09BF\u09A1 \u09A6\u09BF\u09AF\u09BC\u09C7 \u099B\u09BE\u09A8\u09BE \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09C7 \u09AC\u09BE\u0981\u09B6\u09C7\u09B0 \u099A\u09BE\u09B2\u09BF \u09AC\u09BE \u09AC\u09BF\u09B6\u09C7\u09B7 \u099B\u09BE\u0981\u099A\u09C7 \u099A\u09C7\u09AA\u09C7 \u0985\u09A4\u09BF\u09B0\u09BF\u0995\u09CD\u09A4 \u09AA\u09BE\u09A8\u09BF \u099D\u09B0\u09BF\u09AF\u09BC\u09C7 \u09B2\u09AC\u09A3\u09C7\u09B0 \u09A6\u09CD\u09B0\u09AC\u09A3\u09C7 \u09AD\u09BF\u099C\u09BF\u09AF\u09BC\u09C7 \u098F\u0987 \u09AA\u09A8\u09BF\u09B0 \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    detailedDescriptionEn: "Ashtagram Cheese dates back nearly four centuries to Mughal governance in Bengal. Handcrafted in the vast wetland haors of Kishoreganj from fresh local cow and buffalo milk, it is curdled, pressed in woven molds to release whey, and lightly brined to develop a distinctive firm texture and savoury, tangy profile.",
    ingredients: ["\u09A6\u09C7\u09B6\u09BF \u0997\u09B0\u09C1 \u0993 \u09AE\u09B9\u09BF\u09B7\u09C7\u09B0 \u0995\u09BE\u0981\u099A\u09BE \u09A6\u09C1\u09A7 (Raw Cow & Buffalo Milk)", "\u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995 \u099B\u09BE\u09A8\u09BE\u09B0 \u09AC\u09C0\u099C/\u099F\u0995 \u09AA\u09BE\u09A8\u09BF (Natural Whey Starter)", "\u09B2\u09AC\u09A3 (Sea Salt)"],
    preparationMethodEn: "Whole milk is heated gently, coagulated with sour whey, drained in cheesecloth-lined wicker baskets under heavy stone weights, and cured in brine.",
    preparationMethodBn: "\u0995\u09BE\u0981\u099A\u09BE \u09A6\u09C1\u09A7 \u09B9\u09BE\u09B2\u0995\u09BE \u0997\u09B0\u09AE \u0995\u09B0\u09C7 \u099F\u0995 \u09AA\u09BE\u09A8\u09BF \u09A6\u09BF\u09DF\u09C7 \u099B\u09BE\u09A8\u09BE \u0995\u09C7\u099F\u09C7 \u09AC\u09BE\u0981\u09B6\u09C7\u09B0 \u099B\u09BE\u0981\u099A\u09C7 \u09B8\u09C1\u09A4\u09BF \u0995\u09BE\u09AA\u09A1\u09BC\u09C7 \u09AA\u09BE\u09A5\u09B0 \u099A\u09BE\u09AA\u09BE \u09A6\u09BF\u09DF\u09C7 \u09AA\u09BE\u09A8\u09BF \u099D\u09B0\u09BF\u09AF\u09BC\u09C7 \u09B2\u09AC\u09A3 \u09AA\u09BE\u09A8\u09BF\u09A4\u09C7 \u09A1\u09C1\u09AC\u09BF\u09AF\u09BC\u09C7 \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented in Ain-i-Akbari references and officially recognized with GI certification. Handcrafted by hereditary Ghosh artisans in Ashtagram.",
    historicalContextBn: "\u09AE\u09C1\u0998\u09B2 \u0986\u09AE\u09B2 \u09A5\u09C7\u0995\u09C7\u0987 \u0985\u09B7\u09CD\u099F\u0997\u09CD\u09B0\u09BE\u09AE\u09C7\u09B0 \u09AA\u09A8\u09BF\u09B0 \u09A2\u09BE\u0995\u09BE \u0993 \u09A6\u09BF\u09B2\u09CD\u09B2\u09BF\u09B0 \u09A6\u09B0\u09AC\u09BE\u09B0\u09C7 \u0989\u09AA\u09A2\u09CC\u0995\u09A8 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09B9\u09A4\u09CB\u0964 \u09B8\u09AE\u09CD\u09AA\u09CD\u09B0\u09A4\u09BF \u098F\u099F\u09BF \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C7\u09B0 \u0985\u09A8\u09CD\u09AF\u09A4\u09AE \u099C\u09BF\u0986\u0987 \u09AA\u09A3\u09CD\u09AF \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09B8\u09CD\u09AC\u09C0\u0995\u09C3\u09A4\u09BF \u09AA\u09C7\u09AF\u09BC\u09C7\u099B\u09C7\u0964",
    primarySource: "Department of Patents, Designs and Trademarks (DPDT) GI Registry (Ashtagram Cheese)",
    citationSources: [
      "DPDT GI Certification Records: Ashtagram Cheese (Kishoreganj)",
      "The Business Standard: The 400-year history of Ashtagram Paneer",
      "Bangladesh Small and Cottage Industries Corporation (BSCIC) Artisan Study"
    ],
    researchStatus: "gi_certified",
    isGiProduct: true,
    giRegistrationInfo: "Registered Geographical Indication Product under DPDT",
    imageSuggestionPrompt: "Round blocks of artisanal white Ashtagram cheese with crosshatch wicker mold patterns, sliced cleanly on a rustic wooden platter.",
    imageAttribution: "Ashtagram Dairy Artisans / Cultural Heritage Society"
  },
  faridpur: {
    districtId: "faridpur",
    districtNameEn: "Faridpur",
    districtNameBn: "\u09AB\u09B0\u09BF\u09A6\u09AA\u09C1\u09B0",
    divisionId: "dhaka",
    divisionNameEn: "Dhaka",
    foodNameEn: "Bagat Ghosh er Khejur Gurer Payesh & Ilishpeti",
    foodNameBn: "\u09AC\u09BE\u0998\u09BE\u099F \u0998\u09CB\u09B7\u09C7\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u0996\u09C7\u099C\u09C1\u09B0 \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09AA\u09BE\u09AF\u09BC\u09C7\u09B8 \u0993 \u0987\u09B2\u09BF\u09B6\u09AA\u09C7\u099F\u09BF \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    category: "sweets_pitha",
    dietaryType: "sweet",
    approximatePriceBdt: 260,
    shortDescriptionBn: "\u09AE\u09A7\u09C1\u09AE\u09A4\u09C0 \u0985\u09AC\u09AC\u09BE\u09B9\u09BF\u0995\u09BE\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u09A8\u09B2\u09C7\u09A8 \u0997\u09C1\u09A1\u09BC \u0993 \u09B8\u09C1\u0997\u09A8\u09CD\u09A7\u09BF \u099A\u09BE\u09B2\u09C7\u09B0 \u09AA\u09BE\u09AF\u09BC\u09C7\u09B8 \u098F\u09AC\u0982 \u09AC\u09CB\u09AF\u09BC\u09BE\u09B2\u09AE\u09BE\u09B0\u09C0\u09B0 \u0990\u09A4\u09BF\u09B9\u09BE\u09B8\u09BF\u0995 \u0987\u09B2\u09BF\u09B6\u09AA\u09C7\u099F\u09BF \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6\u0964",
    shortDescriptionEn: "Aromatic date palm jaggery payesh simmered with local fragrant rice and the famous fish-belly shaped Ilishpeti sandesh of Boalmari.",
    detailedDescriptionBn: "\u09AC\u09C3\u09B9\u09A4\u09CD\u09A4\u09B0 \u09AB\u09B0\u09BF\u09A6\u09AA\u09C1\u09B0 \u0990\u09A4\u09BF\u09B9\u09BE\u09B8\u09BF\u0995\u09AD\u09BE\u09AC\u09C7 \u0996\u09C7\u099C\u09C1\u09B0 \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09B0\u09BE\u099C\u09A7\u09BE\u09A8\u09C0 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u0996\u09CD\u09AF\u09BE\u09A4\u0964 \u09AE\u09A7\u09C1\u09AE\u09A4\u09C0 \u09A8\u09A6\u09C0\u09B0 \u09A4\u09C0\u09B0\u09C7\u09B0 \u09AC\u09BE\u0998\u09BE\u099F \u0998\u09CB\u09B7 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8 \u09AD\u09BE\u09A3\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u0996\u09C7\u099C\u09C1\u09B0\u09C7\u09B0 \u0997\u09C1\u09A1\u09BC \u0993 \u09A8\u09B2\u09C7\u09A8 \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09AA\u09BE\u09AF\u09BC\u09C7\u09B8 \u09B6\u09A4\u09BE\u09AC\u09CD\u09A6\u09C0\u09B0 \u09AA\u09B0 \u09B6\u09A4\u09BE\u09AC\u09CD\u09A6\u09C0 \u09B8\u09AE\u09BE\u09A6\u09C3\u09A4\u0964 \u098F\u09B0 \u09AA\u09BE\u09B6\u09BE\u09AA\u09BE\u09B6\u09BF \u09AC\u09CB\u09AF\u09BC\u09BE\u09B2\u09AE\u09BE\u09B0\u09C0\u09B0 \u0985\u09A8\u09A8\u09CD\u09AF \u0986\u0995\u09C3\u09A4\u09BF\u09B0 \u0998\u09A8 \u0995\u09CD\u09B7\u09C0\u09B0\u09C7\u09B0 \u2018\u0987\u09B2\u09BF\u09B6\u09AA\u09C7\u099F\u09BF \u09AE\u09BF\u09B7\u09CD\u099F\u09BF\u2019 \u09AA\u09A6\u09CD\u09AE\u09BE\u09AA\u09BE\u09A1\u09BC\u09C7\u09B0 \u09B0\u09A8\u09CD\u09A7\u09A8\u09B8\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF\u09B0 \u098F\u0995 \u0985\u09A8\u09C1\u09AA\u09AE \u0989\u09A6\u09BE\u09B9\u09B0\u09A3\u0964",
    detailedDescriptionEn: "Greater Faridpur has long been renowned as the date-palm belt of southern Bengal. Bagat Ghosh Mistanna Bhandar on the Madhumati basin has perfected slow-simmered payesh using winter Nolen Gur and Gobindobhog rice for generations, accompanied by Boalmari\u2019s unique condensed-milk Ilishpeti sandesh.",
    ingredients: ["\u0996\u09BE\u0981\u099F\u09BF \u0996\u09C7\u099C\u09C1\u09B0\u09C7\u09B0 \u09A8\u09B2\u09C7\u09A8 \u0997\u09C1\u09A1\u09BC (Fresh Nolen Gur)", "\u09B8\u09C1\u0997\u09A8\u09CD\u09A7\u09BF \u0997\u09CB\u09AC\u09BF\u09A8\u09CD\u09A6\u09AD\u09CB\u0997 \u099A\u09BE\u09B2 (Gobindobhog Rice)", "\u0998\u09A8 \u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7 (Reduced Cow Milk)", "\u09A4\u09C7\u099C\u09AA\u09BE\u09A4\u09BE \u0993 \u098F\u09B2\u09BE\u099A (Bay Leaf & Cardamom)", "\u0995\u09CD\u09B7\u09C0\u09B0 \u0993 \u099B\u09BE\u09A8\u09BE (Kheer & Chhana)"],
    preparationMethodEn: "Fragrant rice is simmered in milk reduced to half volume, and freshly tapped warm date molasses is stirred in off the flame to prevent curdling.",
    preparationMethodBn: "\u09A6\u09C1\u09A7 \u099C\u09CD\u09AC\u09BE\u09B2 \u09A6\u09BF\u09DF\u09C7 \u0985\u09B0\u09CD\u09A7\u09C7\u0995\u09C7 \u09A8\u09BE\u09AE\u09BF\u09AF\u09BC\u09C7 \u099A\u09BE\u09B2 \u09B8\u09C7\u09A6\u09CD\u09A7 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC; \u09A8\u09BE\u09AE\u09BE\u09A8\u09CB\u09B0 \u0986\u0997\u09C7 \u0996\u09BE\u0981\u099F\u09BF \u09A8\u09B2\u09C7\u09A8 \u0997\u09C1\u09A1\u09BC \u09B8\u09BE\u09AC\u09A7\u09BE\u09A8\u09C7 \u09AE\u09BF\u09B6\u09BF\u09AF\u09BC\u09C7 \u0998\u09A8 \u09B8\u09C1\u0997\u09A8\u09CD\u09A7\u09BF \u09AA\u09BE\u09AF\u09BC\u09C7\u09B8 \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented in Faridpur District Gazetteer and recorded by the Bengal Folklore Society for its distinctive seasonal winter culinary traditions.",
    historicalContextBn: "\u09AB\u09B0\u09BF\u09A6\u09AA\u09C1\u09B0\u09C7\u09B0 \u099C\u09C7\u09B2\u09BE \u0997\u09C7\u099C\u09C7\u099F\u09BF\u09AF\u09BC\u09BE\u09B0 \u0993 \u09B2\u09CB\u0995\u09B8\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF\u09B0 \u0987\u09A4\u09BF\u09B9\u09BE\u09B8\u09C7 \u09AC\u09CB\u09AF\u09BC\u09BE\u09B2\u09AE\u09BE\u09B0\u09C0 \u0993 \u09AC\u09BE\u0998\u09BE\u099F\u09C7\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF \u09B8\u0997\u09CC\u09B0\u09AC\u09C7 \u09B2\u09BF\u09AA\u09BF\u09AC\u09A6\u09CD\u09A7\u0964",
    primarySource: "Faridpur District Gazetteer & Cultural Heritage Archives",
    citationSources: [
      "Faridpur District Administration Cultural Heritage Forum",
      "The Daily Star Culinary Features: Winter jaggery traditions of Faridpur",
      "Banglapedia: District of Faridpur"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "A warm bowl of creamy golden-brown Nolen Gurer Payesh garnished with sliced pistachios beside an Ilish-belly shaped sandesh.",
    imageAttribution: "Faridpur Culinary Heritage Documentation"
  },
  gopalganj: {
    districtId: "gopalganj",
    districtNameEn: "Gopalganj",
    districtNameBn: "\u0997\u09CB\u09AA\u09BE\u09B2\u0997\u099E\u09CD\u099C",
    divisionId: "dhaka",
    divisionNameEn: "Dhaka",
    foodNameEn: "Datta Mistanno Bhandar er GI Roshogolla",
    foodNameBn: "\u09A6\u09A4\u09CD\u09A4 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8 \u09AD\u09BE\u09A3\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09B0\u09B8\u0997\u09CB\u09B2\u09CD\u09B2\u09BE (\u099C\u09BF\u0986\u0987 \u09B8\u09CD\u09AC\u09C0\u0995\u09C3\u09A4\u09BF\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4)",
    category: "dessert",
    dietaryType: "sweet",
    approximatePriceBdt: 200,
    shortDescriptionBn: "\u0997\u09CB\u09AA\u09BE\u09B2\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09A6\u09A4\u09CD\u09A4 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8 \u09AD\u09BE\u09A3\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u09A8\u09B0\u09AE \u09A4\u09C1\u09B2\u09A4\u09C1\u09B2\u09C7 \u099C\u09BF\u0986\u0987 \u09B8\u09A8\u09A6\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u09B8\u09BE\u09A6\u09BE \u09B0\u09B8\u0997\u09CB\u09B2\u09CD\u09B2\u09BE\u0964",
    shortDescriptionEn: "Official GI-certified melt-in-the-mouth spongy white Roshogolla perfected by Datta Mistanno Bhandar in Gopalganj.",
    detailedDescriptionBn: "\u0997\u09CB\u09AA\u09BE\u09B2\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u09A6\u09A4\u09CD\u09A4 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8 \u09AD\u09BE\u09A3\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u09B0\u09B8\u0997\u09CB\u09B2\u09CD\u09B2\u09BE \u09B8\u09AE\u09CD\u09AA\u09CD\u09B0\u09A4\u09BF \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6 \u09B8\u09B0\u0995\u09BE\u09B0\u09C7\u09B0 \u09AA\u09C7\u099F\u09C7\u09A8\u09CD\u099F\u09B8, \u09A1\u09BF\u099C\u09BE\u0987\u09A8 \u0993 \u099F\u09CD\u09B0\u09C7\u09A1\u09AE\u09BE\u09B0\u09CD\u0995 \u09AC\u09BF\u09AD\u09BE\u0997 (DPDT) \u0995\u09B0\u09CD\u09A4\u09C3\u0995 \u09AD\u09CC\u0997\u09CB\u09B2\u09BF\u0995 \u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6\u0995 (GI) \u09B8\u09A8\u09A6 \u0985\u09B0\u09CD\u099C\u09A8 \u0995\u09B0\u09C7\u099B\u09C7\u0964 \u0996\u09BE\u0981\u099F\u09BF \u09A6\u09C7\u09B6\u09BF \u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7\u09C7\u09B0 \u09A8\u09B0\u09AE \u099B\u09BE\u09A8\u09BE \u0993 \u09B8\u09BE\u09AE\u09BE\u09A8\u09CD\u09AF \u09AE\u09AF\u09BC\u09A6\u09BE \u09A6\u09BF\u09AF\u09BC\u09C7 \u0997\u09CB\u09B2\u09CD\u09B2\u09BE \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09C7 \u09B9\u09BE\u09B2\u0995\u09BE \u09AB\u09C1\u099F\u09A8\u09CD\u09A4 \u099A\u09BF\u09A8\u09BF\u09B0 \u09B8\u09BF\u09B0\u09BE\u09AF\u09BC \u09A8\u09BF\u0996\u09C1\u0981\u09A4 \u09B8\u09AE\u09AF\u09BC\u09C7 \u09B8\u09C7\u09A6\u09CD\u09A7 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC, \u09AB\u09B2\u09C7 \u098F\u099F\u09BF \u0985\u09A4\u09CD\u09AF\u09A8\u09CD\u09A4 \u09B8\u09CD\u09AA\u099E\u09CD\u099C\u09BF \u0993 \u09A8\u09B0\u09AE \u09B9\u09AF\u09BC\u0964",
    detailedDescriptionEn: "Datta Mistanno Bhandar in Gopalganj is the home of Gopalganj\u2019s official GI-certified Roshogolla. Made from pure local cow milk chhana with zero adulteration, the dumplings are cooked in a clarifying light sugar syrup to achieve an extraordinarily soft, spongy texture that releases sweet syrup with every bite.",
    ingredients: ["\u0996\u09BE\u0981\u099F\u09BF \u09A6\u09C7\u09B6\u09BF \u0997\u09BE\u09AD\u09C0\u09B0 \u09A6\u09C1\u09A7\u09C7\u09B0 \u099B\u09BE\u09A8\u09BE (Fresh Cow Milk Chhana)", "\u099A\u09BF\u09A8\u09BF\u09B0 \u09B8\u09BF\u09B0\u09BE (Purified Sugar Syrup)", "\u09B8\u09BE\u09AE\u09BE\u09A8\u09CD\u09AF \u09B8\u09C1\u099C\u09BF/\u09AE\u09AF\u09BC\u09A6\u09BE (Semolina/Flour binder)", "\u098F\u09B2\u09BE\u099A (Green Cardamom)"],
    preparationMethodEn: "Soft chhana is kneaded until velvety, formed into smooth balls, and poached in bubbling clarified sugar syrup until bouncy and translucent.",
    preparationMethodBn: "\u09A4\u09BE\u099C\u09BE \u099B\u09BE\u09A8\u09BE \u09B9\u09BE\u09A4\u09C7\u09B0 \u09A4\u09BE\u09B2\u09C1\u09A4\u09C7 \u099A\u09C7\u09AA\u09C7 \u09AE\u09B8\u09C3\u09A3 \u0995\u09B0\u09C7 \u09AC\u09B2 \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC \u098F\u09AC\u0982 \u09AB\u09C1\u099F\u09A8\u09CD\u09A4 \u09AA\u09BE\u09A4\u09B2\u09BE \u099A\u09BF\u09A8\u09BF\u09B0 \u09B8\u09BF\u09B0\u09BE\u09AF\u09BC \u09A8\u09BF\u09B0\u09CD\u09A6\u09BF\u09B7\u09CD\u099F \u09B8\u09AE\u09AF\u09BC \u09AB\u09C1\u099F\u09BF\u09AF\u09BC\u09C7 \u09B0\u09B8\u09C7 \u09AD\u09BF\u099C\u09BF\u09AF\u09BC\u09C7 \u09B0\u09BE\u0996\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Granted Geographical Indication (GI) accreditation by the Ministry of Industries as an authentic traditional confection of Gopalganj.",
    historicalContextBn: "\u09A6\u09A4\u09CD\u09A4 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8 \u09AD\u09BE\u09A3\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u09B6\u09A4\u09AC\u09B0\u09CD\u09B7\u09C0 \u09B0\u09B8\u0997\u09CB\u09B2\u09CD\u09B2\u09BE \u0997\u09CB\u09AA\u09BE\u09B2\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u098F\u0995\u09AE\u09BE\u09A4\u09CD\u09B0 \u0996\u09BE\u09A6\u09CD\u09AF\u09AA\u09A3\u09CD\u09AF \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u099C\u09BE\u09A4\u09C0\u09AF\u09BC\u09AD\u09BE\u09AC\u09C7 \u099C\u09BF\u0986\u0987 \u09B8\u09A8\u09A6 \u09B2\u09BE\u09AD \u0995\u09B0\u09C7\u099B\u09C7\u0964",
    primarySource: "Department of Patents, Designs and Trademarks (DPDT) GI Registry (Gopalganj Roshogolla)",
    citationSources: [
      "The Business Standard: Gopalganj\u2019s Roshogolla gets GI status",
      "DPDT Official GI Accreditation Gazette",
      "Gopalganj District Administration Heritage Records"
    ],
    researchStatus: "gi_certified",
    isGiProduct: true,
    giRegistrationInfo: "Registered Geographical Indication Product under DPDT",
    imageSuggestionPrompt: "White spongy Roshogollas submerged in clear cardamom sugar syrup served in a classic glass bowl.",
    imageAttribution: "Datta Mistanno Bhandar / Foodie BD Archive"
  },
  madaripur: {
    districtId: "madaripur",
    districtNameEn: "Madaripur",
    districtNameBn: "\u09AE\u09BE\u09A6\u09BE\u09B0\u09C0\u09AA\u09C1\u09B0",
    divisionId: "dhaka",
    divisionNameEn: "Dhaka",
    foodNameEn: "Madaripur Jhola Gur Sandesh & Chhanar Kheerchop",
    foodNameBn: "\u09AE\u09BE\u09A6\u09BE\u09B0\u09C0\u09AA\u09C1\u09B0\u09C7\u09B0 \u099D\u09CB\u09B2\u09BE \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6 \u0993 \u099B\u09BE\u09A8\u09BE\u09B0 \u0995\u09CD\u09B7\u09C0\u09B0\u099A\u09AA",
    category: "sweets_pitha",
    dietaryType: "sweet",
    approximatePriceBdt: 240,
    shortDescriptionBn: "\u09AE\u09BE\u09A6\u09BE\u09B0\u09C0\u09AA\u09C1\u09B0\u09C7\u09B0 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u0997\u09BE\u09A2\u09BC \u09B8\u09C1\u09AC\u09BE\u09B8\u09BF\u09A4 \u0996\u09C7\u099C\u09C1\u09B0\u09C7\u09B0 \u099D\u09CB\u09B2\u09BE \u0997\u09C1\u09A1\u09BC \u09A6\u09BF\u09AF\u09BC\u09C7 \u09AE\u09BE\u0996\u09BE \u09A8\u09B0\u09AE \u099B\u09BE\u09A8\u09BE\u09B0 \u0995\u09BE\u0981\u099A\u09BE\u09B8\u09A8\u09CD\u09A6\u09C7\u09B6 \u0993 \u0995\u09CD\u09B7\u09C0\u09B0\u099A\u09AA\u0964",
    shortDescriptionEn: "Delicate chhana sandesh blended with Madaripur\u2019s famous dark liquid date palm jaggery (Jhola Gur) and rich Kheerchop.",
    detailedDescriptionBn: "\u09AE\u09BE\u09A6\u09BE\u09B0\u09C0\u09AA\u09C1\u09B0 \u099C\u09C7\u09B2\u09BE \u0996\u09C7\u099C\u09C1\u09B0\u09C7\u09B0 \u09B0\u09B8\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09A6\u0995\u09CD\u09B7\u09BF\u09A3\u09AC\u0999\u09CD\u0997\u09C7\u09B0 \u0985\u09A8\u09CD\u09AF\u09A4\u09AE \u09AA\u09CD\u09B0\u09A7\u09BE\u09A8 \u0995\u09C7\u09A8\u09CD\u09A6\u09CD\u09B0\u0964 \u098F\u0996\u09BE\u09A8\u0995\u09BE\u09B0 \u09A4\u09B0\u09B2 \u09A8\u09B2\u09C7\u09A8 \u09AC\u09BE \u099D\u09CB\u09B2\u09BE \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995 \u09B8\u09C1\u09AC\u09BE\u09B8 \u0993 \u0995\u09CD\u09AF\u09BE\u09B0\u09C7\u09AE\u09C7\u09B2 \u09B8\u09CD\u09AC\u09BE\u09A6 \u09AC\u09BF\u09B6\u09CD\u09AC\u09AE\u09BE\u09A8\u09C7\u09B0\u0964 \u098F\u0987 \u099D\u09CB\u09B2\u09BE \u0997\u09C1\u09A1\u09BC \u09A4\u09BE\u099C\u09BE \u099B\u09BE\u09A8\u09BE\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AE\u09C7\u0996\u09C7 \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC \u09A8\u09B0\u09AE \u09AA\u09BE\u0995\u09C7\u09B0 \u0995\u09BE\u0981\u099A\u09BE\u09B8\u09A8\u09CD\u09A6\u09C7\u09B6 \u098F\u09AC\u0982 \u09A6\u09C1\u09A7\u09C7\u09B0 \u09AE\u09BE\u09B2\u09BE\u0987\u09AF\u09BC\u09C7 \u09A1\u09CB\u09AC\u09BE\u09A8\u09CB \u0995\u09CD\u09B7\u09C0\u09B0\u099A\u09AA\u0964",
    detailedDescriptionEn: "Madaripur is famed across Bangladesh for its abundant date palm groves and thick, amber liquid jaggery (Jhola Gur). Local sweet artisans gently knead freshly curdled cow milk chhana with cold-filtered Jhola Gur to make velvety sandesh and syrup-soaked Kheerchop without artificial flavoring.",
    ingredients: ["\u0996\u09C7\u099C\u09C1\u09B0\u09C7\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u099D\u09CB\u09B2\u09BE \u0997\u09C1\u09A1\u09BC (Liquid Date Palm Jaggery)", "\u09A6\u09C7\u09B6\u09BF \u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7\u09C7\u09B0 \u099B\u09BE\u09A8\u09BE (Cow Milk Chhana)", "\u0998\u09A8 \u09AE\u09BE\u09B2\u09BE\u0987 (Clotted Cream)", "\u098F\u09B2\u09BE\u099A \u0997\u09C1\u0981\u09A1\u09BC\u09CB (Cardamom Powder)"],
    preparationMethodEn: "Fresh moist chhana is ground smooth with liquid jaggery over very low heat for a few minutes and shaped in wooden carved terracotta molds.",
    preparationMethodBn: "\u09A4\u09BE\u099C\u09BE \u099B\u09BE\u09A8\u09BE \u098F\u09AC\u0982 \u099D\u09CB\u09B2\u09BE \u0997\u09C1\u09A1\u09BC \u098F\u0995\u09B8\u09BE\u09A5\u09C7 \u09B9\u09BE\u09B2\u0995\u09BE \u0986\u0981\u099A\u09C7 \u0995\u09AF\u09BC\u09C7\u0995 \u09AE\u09BF\u09A8\u09BF\u099F \u09AE\u09C7\u0996\u09C7 \u0995\u09BE\u09A0\u09C7\u09B0 \u09AC\u09BE \u09AE\u09BE\u099F\u09BF\u09B0 \u099B\u09BE\u0981\u099A\u09C7 \u09AB\u09C7\u09B2\u09C7 \u09A4\u09C8\u09B0\u09BF \u09B9\u09AF\u09BC \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6\u0964",
    historicalContextEn: "Documented in Dhaka Tribune culinary features and Greater Faridpur historical gazetteers for centuries of date palm cultivation.",
    historicalContextBn: "\u09AE\u09BE\u09A6\u09BE\u09B0\u09C0\u09AA\u09C1\u09B0 \u09B6\u09B9\u09B0\u09C7\u09B0 \u0985\u09B0\u09CD\u09A7\u09B6\u09A4\u09BE\u09A7\u09BF\u0995 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09A6\u09CB\u0995\u09BE\u09A8\u09C7 \u09B6\u09C0\u09A4\u09C7\u09B0 \u09AE\u09CC\u09B8\u09C1\u09AE\u09C7 \u09A4\u09C8\u09B0\u09BF \u099D\u09CB\u09B2\u09BE \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6\u09C7\u09B0 \u09A6\u09C7\u09B6\u099C\u09CB\u09A1\u09BC\u09BE \u09B8\u09C1\u09A8\u09BE\u09AE \u09B0\u09AF\u09BC\u09C7\u099B\u09C7\u0964",
    primarySource: "Dhaka Tribune & Madaripur District Heritage Studies",
    citationSources: [
      "Dhaka Tribune: The century-old sweet shops and date molasses of Madaripur",
      "Madaripur District Administration Cultural Profile",
      "Regional Agro-Horticulture Documentation on Date Palm Farming"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Artisanal golden-brown Jhola Gur sandesh stamped with floral motifs alongside a pot of amber date syrup.",
    imageAttribution: "Madaripur Confectionery Heritage Archives"
  },
  rajbari: {
    districtId: "rajbari",
    districtNameEn: "Rajbari",
    districtNameBn: "\u09B0\u09BE\u099C\u09AC\u09BE\u09DC\u09C0",
    divisionId: "dhaka",
    divisionNameEn: "Dhaka",
    foodNameEn: "Rajbari Kheer Chamcham (Shankar & Vadu Saha)",
    foodNameBn: "\u09B0\u09BE\u099C\u09AC\u09BE\u09A1\u09BC\u09C0\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0995\u09CD\u09B7\u09C0\u09B0 \u099A\u09AE\u099A\u09AE (\u09B6\u0982\u0995\u09B0 \u0993 \u09AD\u09BE\u09A6\u09C1 \u09B8\u09BE\u09B9\u09BE\u09B0 \u099A\u09AE\u099A\u09AE)",
    category: "dessert",
    dietaryType: "sweet",
    approximatePriceBdt: 280,
    shortDescriptionBn: "\u0998\u09A8 \u09A6\u09BE\u09A8\u09BE\u09A6\u09BE\u09B0 \u0995\u09CD\u09B7\u09C0\u09B0\u09C7\u09B0 \u0986\u09B8\u09CD\u09A4\u09B0\u09A3\u09C7 \u09AE\u09CB\u09A1\u09BC\u09BE\u09A8\u09CB \u09B0\u09BE\u099C\u09AC\u09BE\u09A1\u09BC\u09C0 \u09B0\u09C7\u09B2\u0997\u09C7\u099F\u09C7\u09B0 \u09B6\u09A4\u09BE\u09AC\u09CD\u09A6\u09C0\u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u0995\u09CD\u09B7\u09C0\u09B0 \u099A\u09AE\u099A\u09AE\u0964",
    shortDescriptionEn: "Centuries-old oblong chamcham encased in a thick blanket of slow-reduced grainy milk kheer from the famous sweetmakers of Rajbari.",
    detailedDescriptionBn: "\u09B0\u09BE\u099C\u09AC\u09BE\u09A1\u09BC\u09C0\u09B0 \u09B0\u09C7\u09B2\u0997\u09C7\u099F \u0993 \u09A4\u09BF\u09A8 \u09AA\u099F\u09CD\u099F\u09BF \u0985\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u09B6\u0982\u0995\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8 \u09AD\u09BE\u09A3\u09CD\u09A1\u09BE\u09B0 \u0993 \u09AD\u09BE\u09A6\u09C1 \u09B8\u09BE\u09B9\u09BE\u09B0 \u0995\u09CD\u09B7\u09C0\u09B0 \u099A\u09AE\u099A\u09AE \u09AA\u09CD\u09B0\u09BE\u09AF\u09BC \u09A6\u09C7\u09A1\u09BC \u09B6\u09A4\u09BE\u09AC\u09CD\u09A6\u09C0 \u09A7\u09B0\u09C7 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4\u0964 \u099B\u09BE\u09A8\u09BE\u09B0 \u09A4\u09C8\u09B0\u09BF \u09A8\u09B0\u09AE \u099A\u09AE\u099A\u09AE\u0995\u09C7 \u099A\u09BF\u09A8\u09BF\u09B0 \u0995\u09A1\u09BC\u09BE \u09B8\u09BF\u09B0\u09BE\u09AF\u09BC \u09A6\u09C0\u09B0\u09CD\u0998\u0995\u09CD\u09B7\u09A3 \u099C\u09CD\u09AC\u09BE\u09B2 \u09A6\u09BF\u09AF\u09BC\u09C7 \u09A4\u09BE\u09AE\u09BE\u099F\u09C7 \u09B0\u0999 \u0986\u09A8\u09BE \u09B9\u09AF\u09BC\u0964 \u098F\u09B0\u09AA\u09B0 \u09B8\u09C7\u099F\u09BF\u0995\u09C7 \u0996\u09BE\u0981\u099F\u09BF \u0998\u09A8 \u09AE\u09BE\u09B2\u09BE\u0987 \u09AC\u09BE \u09A6\u09C1\u09A7\u09C7\u09B0 \u09A6\u09BE\u09A8\u09BE\u09A6\u09BE\u09B0 \u09B6\u09C1\u0995\u09A8\u09CB \u0995\u09CD\u09B7\u09C0\u09B0\u09C7 \u09AA\u09C1\u09B0\u09CB\u09AA\u09C1\u09B0\u09BF \u09AE\u09C1\u09A1\u09BC\u09C7 \u09AA\u09B0\u09BF\u09AC\u09C7\u09B6\u09A8 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    detailedDescriptionEn: "Originating around the historic Rajbari railway junction, the Kheer Chamcham developed by Shankar Ghosh and Nirmol (Vadu) Saha is distinctive. Chhana dough is boiled in caramel sugar syrup until mahogany, then enveloped in a lavish exterior layer of dry grated milk fudge (kheer).",
    ingredients: ["\u0996\u09BE\u0981\u099F\u09BF \u099B\u09BE\u09A8\u09BE (Fresh Chhana)", "\u0998\u09A8 \u09B6\u09C1\u0995\u09A8\u09CB \u0995\u09CD\u09B7\u09C0\u09B0 \u0993 \u09AE\u09BE\u0993\u09AF\u09BC\u09BE (Grated Kheer & Mawa)", "\u099A\u09BF\u09A8\u09BF\u09B0 \u09B8\u09BF\u09B0\u09BE (Caramelized Sugar Syrup)", "\u098F\u09B2\u09BE\u099A (Cardamom)"],
    preparationMethodEn: "Chhana is shaped into oblong dumplings, simmered in boiling syrup until amber, cooled, and rolled thoroughly in rich desiccated milk kheer.",
    preparationMethodBn: "\u099B\u09BE\u09A8\u09BE\u09B0 \u0997\u09CB\u09B2\u09CD\u09B2\u09BE \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09C7 \u0998\u09A8 \u099A\u09BF\u09A8\u09BF\u09B0 \u09B0\u09B8\u09C7 \u09B8\u09C7\u09A6\u09CD\u09A7 \u0995\u09B0\u09C7 \u09B8\u09CB\u09A8\u09BE\u09B2\u09C0 \u09B0\u0999 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC \u098F\u09AC\u0982 \u09A8\u09BE\u09AE\u09BF\u09AF\u09BC\u09C7 \u09A0\u09BE\u09A8\u09CD\u09A1\u09BE \u0995\u09B0\u09C7 \u0989\u09AA\u09B0 \u09A6\u09BF\u09AF\u09BC\u09C7 \u0998\u09A8 \u09B6\u09C1\u0995\u09A8\u09BE \u0995\u09CD\u09B7\u09C0\u09B0\u09C7\u09B0 \u09B8\u09CD\u09A4\u09B0 \u09AE\u09BE\u0996\u09BE\u09A8\u09CB \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Celebrated in railway heritage chronicles and culinary journals as the hallmark confection of the historic Bengal-Assam railway junction.",
    historicalContextBn: "\u09AC\u09CD\u09B0\u09BF\u099F\u09BF\u09B6 \u0986\u09AE\u09B2 \u09A5\u09C7\u0995\u09C7\u0987 \u09B0\u09BE\u099C\u09AC\u09BE\u09A1\u09BC\u09C0 \u09B0\u09C7\u09B2 \u099C\u0982\u09B6\u09A8\u09C7\u09B0 \u09AE\u09BE\u09A7\u09CD\u09AF\u09AE\u09C7 \u098F\u0987 \u0995\u09CD\u09B7\u09C0\u09B0 \u099A\u09AE\u099A\u09AE\u09C7\u09B0 \u0996\u09CD\u09AF\u09BE\u09A4\u09BF \u0985\u09AC\u09BF\u09AD\u0995\u09CD\u09A4 \u09AC\u09BE\u0982\u09B2\u09BE\u09AF\u09BC \u099B\u09A1\u09BC\u09BF\u09AF\u09BC\u09C7 \u09AA\u09A1\u09BC\u09C7\u099B\u09BF\u09B2\u0964",
    primarySource: "Rajbari District Administration Cultural Register & Local Chronicles",
    citationSources: [
      "The Business Standard: The century-old taste of Rajbari Chamcham",
      "Rajbari District Administration Heritage Documentation",
      "Folklore Institute of Greater Faridpur"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Oblong mahogany chamcham thickly coated in rich white granular milk kheer on an ornate brass plate.",
    imageAttribution: "Rajbari Heritage Sweetmakers Association"
  },
  lakshmipur: {
    districtId: "lakshmipur",
    districtNameEn: "Lakshmipur",
    districtNameBn: "\u09B2\u0995\u09CD\u09B7\u09CD\u09AE\u09C0\u09AA\u09C1\u09B0",
    divisionId: "chattogram",
    divisionNameEn: "Chattogram",
    foodNameEn: "Ramgati Moyish-er Doi (Meghna Buffalo Curd)",
    foodNameBn: "\u09B0\u09BE\u09AE\u0997\u09A4\u09BF\u09B0 \u09AE\u09B9\u09BF\u09B7\u09C7\u09B0 \u09A6\u09C1\u09A7\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0995\u09BE\u0981\u099A\u09BE \u09A6\u0987",
    category: "dessert",
    dietaryType: "veg",
    approximatePriceBdt: 260,
    shortDescriptionBn: "\u09AE\u09C7\u0998\u09A8\u09BE \u09A8\u09A6\u09C0\u09B0 \u099A\u09B0\u09BE\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u09AE\u09B9\u09BF\u09B7\u09C7\u09B0 \u0995\u09BE\u0981\u099A\u09BE \u09A6\u09C1\u09A7 \u09A5\u09C7\u0995\u09C7 \u09AA\u09CB\u09A1\u09BC\u09BE\u09AE\u09BE\u099F\u09BF\u09B0 \u09B8\u09BE\u09A8\u0995\u09BF\u09A4\u09C7 \u099C\u09AE\u09BE\u09A8\u09CB \u0998\u09A8 \u0993 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u099F\u0995-\u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09A6\u0987\u0964",
    shortDescriptionEn: "Unpasteurized thick buffalo curd fermented naturally in porous unglazed clay bowls from the island chars of Ramgati.",
    detailedDescriptionBn: "\u09B2\u0995\u09CD\u09B7\u09CD\u09AE\u09C0\u09AA\u09C1\u09B0 \u099C\u09C7\u09B2\u09BE\u09B0 \u09B0\u09BE\u09AE\u0997\u09A4\u09BF \u0993 \u0995\u09AE\u09B2\u09A8\u0997\u09B0 \u0989\u09AA\u099C\u09C7\u09B2\u09BE\u09B0 \u09AE\u09C7\u0998\u09A8\u09BE \u09A8\u09A6\u09C0\u09B0 \u09AC\u09BF\u09B8\u09CD\u09A4\u09C0\u09B0\u09CD\u09A3 \u099A\u09B0\u09C7 \u09B9\u09BE\u099C\u09BE\u09B0 \u09B9\u09BE\u099C\u09BE\u09B0 \u09AE\u09B9\u09BF\u09B7\u09C7\u09B0 \u09AC\u09BE\u09A5\u09BE\u09A8 \u09B0\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u098F\u0987 \u09AE\u09B9\u09BF\u09B7\u09C7\u09B0 \u0985\u09A4\u09CD\u09AF\u09A8\u09CD\u09A4 \u09AA\u09C1\u09B7\u09CD\u099F\u09BF\u0995\u09B0 \u0993 \u0998\u09A8 \u0995\u09BE\u0981\u099A\u09BE \u09A6\u09C1\u09A7 \u0995\u09CB\u09A8\u09CB \u09AA\u09CD\u09B0\u0995\u09BE\u09B0 \u09AD\u09C7\u099C\u09BE\u09B2 \u099B\u09BE\u09A1\u09BC\u09BE \u099B\u09C7\u0981\u0995\u09C7 \u09AE\u09BE\u099F\u09BF\u09B0 \u09B8\u09BE\u09A8\u0995\u09BF\u09A4\u09C7 \u09A2\u09C7\u09B2\u09C7 \u09B0\u09BE\u0996\u09BE \u09B9\u09AF\u09BC\u0964 \u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995\u09AD\u09BE\u09AC\u09C7 \u0995\u09CB\u09A8\u09CB \u099C\u09CD\u09AC\u09BE\u09B2 \u09A6\u09C7\u0993\u09AF\u09BC\u09BE \u099B\u09BE\u09A1\u09BC\u09BE\u0987 \u098F\u0987 \u09A6\u09C1\u09A7 \u099C\u09AE\u09BE\u099F \u09AC\u09C7\u0981\u09A7\u09C7 \u0985\u09A4\u09CD\u09AF\u09A8\u09CD\u09A4 \u0998\u09A8 \u0993 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09A6\u09A7\u09BF \u09A4\u09C8\u09B0\u09BF \u09B9\u09AF\u09BC\u0964 \u098F\u099F\u09BF \u099A\u09B0\u09BE\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u09AC\u09BF\u09AF\u09BC\u09C7 \u0993 \u0989\u09CE\u09B8\u09AC\u09C7 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09C7\u09B0 \u09AA\u09CD\u09B0\u09A4\u09C0\u0995\u0964",
    detailedDescriptionEn: "In the riverine char islands of Ramgati along the Meghna estuary, large semi-wild buffalo herds graze on coastal pastures. Their exceptionally rich, high-fat raw milk is traditionally strained directly into shallow unglazed earthenware pots (shanki) without boiling. Natural ambient fermentation yields an incredibly thick, knife-cut curd essential to coastal celebrations.",
    ingredients: ["\u09AE\u09C7\u0998\u09A8\u09BE\u09B0 \u099A\u09B0\u09C7\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u09AE\u09B9\u09BF\u09B7\u09C7\u09B0 \u09A6\u09C1\u09A7 (Raw Coastal Buffalo Milk)", "\u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995 \u09A6\u09A7\u09BF \u09AC\u09C0\u099C (Traditional Curd Culture)"],
    preparationMethodEn: "Raw whole buffalo milk is strained through fine cloth, inoculated with pure starter culture, poured into porous clay plates, and allowed to set undisturbed in a dry chamber.",
    preparationMethodBn: "\u0995\u09BE\u0981\u099A\u09BE \u09AE\u09B9\u09BF\u09B7\u09C7\u09B0 \u09A6\u09C1\u09A7 \u099C\u09CD\u09AC\u09BE\u09B2 \u09A8\u09BE \u09A6\u09BF\u09AF\u09BC\u09C7 \u09AA\u09B0\u09BF\u09B7\u09CD\u0995\u09BE\u09B0 \u0995\u09BE\u09AA\u09A1\u09BC\u09C7 \u099B\u09C7\u0981\u0995\u09C7 \u09AE\u09BE\u099F\u09BF\u09B0 \u09B8\u09BE\u09A8\u0995\u09BF\u09A4\u09C7 \u09A2\u09C7\u09B2\u09C7 \u0985\u09B2\u09CD\u09AA \u09AA\u09C1\u09B0\u09CB\u09A8\u09CB \u09A6\u0987\u09AF\u09BC\u09C7\u09B0 \u09AC\u09C0\u099C \u09AE\u09BF\u09B6\u09BF\u09AF\u09BC\u09C7 \u09B8\u09BE\u09B0\u09BE\u09B0\u09BE\u09A4 \u09A4\u09BE\u09AA\u09C7 \u09B0\u09BE\u0996\u09B2\u09C7 \u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u0998\u09A8 \u09A6\u0987 \u099C\u09AE\u09C7\u0964",
    historicalContextEn: "Documented in coastal livestock studies and culinary ethnography as an irreplaceable heritage food of the lower Meghna basin.",
    historicalContextBn: "\u09B0\u09BE\u09AE\u0997\u09A4\u09BF\u09B0 \u099A\u09B0 \u0986\u09B2\u09C7\u0995\u099C\u09BE\u09A8\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u09B6\u09A4\u09AC\u09B0\u09CD\u09B7\u09C0 \u09AC\u09BE\u09A5\u09BE\u09A8 \u09B8\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF \u0993 \u0989\u09AA\u0995\u09C2\u09B2\u09C0\u09AF\u09BC \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09A6\u0987\u09AF\u09BC\u09C7\u09B0 \u0996\u09CD\u09AF\u09BE\u09A4\u09BF \u09B8\u09B0\u09CD\u09AC\u099C\u09A8\u09AC\u09BF\u09A6\u09BF\u09A4\u0964",
    primarySource: "Lakshmipur District Administration & Coastal Agricultural Studies",
    citationSources: [
      "The Business Standard: Ramgati\u2019s century-old buffalo curd tradition",
      "ResearchGate: Dairy Traditions and Buffalo Husbandry in Coastal Lakshmipur",
      "Lakshmipur District Portal (Cultural Division)"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Thick creamy white buffalo curd resting in an unglazed terracotta bowl so dense a spoon stands upright inside it.",
    imageAttribution: "Coastal Bengal Folk Culture Institute"
  },
  rangamati: {
    districtId: "rangamati",
    districtNameEn: "Rangamati",
    districtNameBn: "\u09B0\u09BE\u0999\u09CD\u0997\u09BE\u09AE\u09BE\u099F\u09BF",
    divisionId: "chattogram",
    divisionNameEn: "Chattogram",
    foodNameEn: "Indigenous Bamboo Chicken (Huro Chumo) & Mundi",
    foodNameBn: "\u09AA\u09BE\u09B9\u09BE\u09A1\u09BC\u09BF \u09AC\u09BE\u0981\u09B6 \u09AE\u09C1\u09B0\u0997\u09BF (\u09B9\u09C1\u09B0\u09CB \u099A\u09C1\u0995\u09CB) \u0993 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AE\u09BE\u09B0\u09AE\u09BE \u09AE\u09C1\u09A8\u09CD\u09A1\u09BF",
    category: "traditional",
    dietaryType: "non-veg",
    approximatePriceBdt: 340,
    shortDescriptionBn: "\u09AA\u09BE\u09B9\u09BE\u09A1\u09BC\u09BF \u09AC\u09C1\u09A8\u09CB \u09AE\u09B6\u09B2\u09BE\u09AF\u09BC \u09AE\u09BE\u0996\u09BF\u09AF\u09BC\u09C7 \u0995\u09BE\u0981\u099A\u09BE \u09AC\u09BE\u0981\u09B6\u09C7\u09B0 \u099A\u09C1\u0999\u09CD\u0997\u09BE\u09AF\u09BC \u0995\u09BE\u09A0\u0995\u09AF\u09BC\u09B2\u09BE\u09B0 \u0986\u0997\u09C1\u09A8\u09C7 \u09AA\u09CB\u09A1\u09BC\u09BE\u09A8\u09CB \u09A6\u09C7\u09B6\u09BF \u09AE\u09C1\u09B0\u0997\u09BF \u0993 \u09AE\u09BE\u09B0\u09AE\u09BE \u09B8\u09AE\u09CD\u09AA\u09CD\u09B0\u09A6\u09BE\u09AF\u09BC\u09C7\u09B0 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u099A\u09BE\u09B2\u09C7\u09B0 \u09A8\u09C1\u09A1\u09C1\u09B2\u09B8 (\u09AE\u09C1\u09A8\u09CD\u09A1\u09BF)\u0964",
    shortDescriptionEn: "Country chicken infused with wild indigenous herbs roasted inside green bamboo cylinders over charcoal, paired with savory rice noodle soup (Mundi).",
    detailedDescriptionBn: "\u09AA\u09BE\u09B0\u09CD\u09AC\u09A4\u09CD\u09AF \u09B0\u09BE\u0999\u09CD\u0997\u09BE\u09AE\u09BE\u099F\u09BF\u09B0 \u099A\u09BE\u0995\u09AE\u09BE, \u09AE\u09BE\u09B0\u09AE\u09BE \u0993 \u09A4\u099E\u09CD\u099A\u0999\u09CD\u0997\u09CD\u09AF\u09BE \u0986\u09A6\u09BF\u09AC\u09BE\u09B8\u09C0 \u099C\u09A8\u0997\u09CB\u09B7\u09CD\u09A0\u09C0\u09B0 \u09B0\u09A8\u09CD\u09A7\u09A8\u09B6\u09C8\u09B2\u09C0\u09B0 \u098F\u0995 \u0985\u09A8\u09A8\u09CD\u09AF \u09A8\u09BF\u09A6\u09B0\u09CD\u09B6\u09A8 \u09AC\u09BE\u0981\u09B6 \u09AE\u09C1\u09B0\u0997\u09BF\u0964 \u0996\u09BE\u0981\u099F\u09BF \u09A6\u09C7\u09B6\u09BF \u09AE\u09C1\u09B0\u0997\u09BF \u09AA\u09BE\u09B9\u09BE\u09A1\u09BC\u09BF \u0986\u09A6\u09BE, \u0995\u09BE\u0981\u099A\u09BE \u09AE\u09B0\u09BF\u099A \u0993 \u09B8\u09C1\u0997\u09A8\u09CD\u09A7\u09BF \u09AD\u09C7\u09B7\u099C\u09C7 \u09AE\u09C7\u0996\u09C7 \u0995\u099A\u09BF \u09AC\u09BE\u0981\u09B6\u09C7\u09B0 \u09AD\u09C7\u09A4\u09B0 \u0995\u09B2\u09BE\u09AA\u09BE\u09A4\u09BE\u09AF\u09BC \u09AE\u09C1\u0996 \u09AC\u09A8\u09CD\u09A7 \u0995\u09B0\u09C7 \u09A7\u09BF\u09AE\u09C7 \u0995\u09AF\u09BC\u09B2\u09BE\u09B0 \u0986\u0997\u09C1\u09A8\u09C7 \u09B8\u09C7\u0981\u0995\u09BE \u09B9\u09AF\u09BC\u0964 \u09AC\u09BE\u0981\u09B6\u09C7\u09B0 \u0995\u09B7 \u09AE\u09BE\u0982\u09B8\u0995\u09C7 \u09A6\u09C7\u09AF\u09BC \u09AC\u09BF\u09B6\u09C7\u09B7 \u09B8\u09C1\u09AC\u09BE\u09B8\u0964 \u09B8\u09BE\u09A5\u09C7 \u09A5\u09BE\u0995\u09C7 \u09AE\u09BE\u09B0\u09AE\u09BE \u09B8\u09AE\u09CD\u09AA\u09CD\u09B0\u09A6\u09BE\u09AF\u09BC\u09C7\u09B0 \u099C\u09A8\u09AA\u09CD\u09B0\u09BF\u09AF\u09BC \u099A\u09BE\u09B2\u09C7\u09B0 \u09A4\u09BE\u099C\u09BE \u09A8\u09C1\u09A1\u09C1\u09B2\u09B8 \u09B8\u09CD\u09AF\u09C1\u09AA \u09AC\u09BE \u09AE\u09C1\u09A8\u09CD\u09A1\u09BF\u0964",
    detailedDescriptionEn: "An iconic culinary tradition of the indigenous Chakma and Marma communities of the Chittagong Hill Tracts. Free-range chicken is marinated with mountain ginger, fiery green chilies, and wild herbs, packed into freshly cut green bamboo poles, sealed with banana leaves, and roasted slowly over charcoal coals. It is complemented by Mundi, the beloved indigenous fresh rice noodle broth.",
    ingredients: ["\u09AA\u09BE\u09B9\u09BE\u09A1\u09BC\u09BF \u09A6\u09C7\u09B6\u09BF \u09AE\u09C1\u09B0\u0997\u09BF (Hill Tracts Free-Range Chicken)", "\u0995\u099A\u09BF \u09B8\u09AC\u09C1\u099C \u09AC\u09BE\u0981\u09B6\u09C7\u09B0 \u099A\u09C1\u0999\u09CD\u0997\u09BE (Green Bamboo Cylinder)", "\u09AA\u09BE\u09B9\u09BE\u09A1\u09BC\u09BF \u09AC\u09C1\u09A8\u09CB \u0986\u09A6\u09BE \u0993 \u09B0\u09B8\u09C1\u09A8 (Wild Mountain Ginger & Garlic)", "\u0995\u09BE\u0981\u099A\u09BE \u09AE\u09B0\u09BF\u099A \u0993 \u09A7\u09A8\u09BF\u09AF\u09BC\u09BE\u09AA\u09BE\u09A4\u09BE (Green Chilies & Fresh Cilantro)", "\u099A\u09BE\u09B2\u09C7\u09B0 \u09A8\u09C1\u09A1\u09C1\u09B2\u09B8 (Fresh Rice Noodles for Mundi)"],
    preparationMethodEn: "Marinated chicken is packed into wet green bamboo stems, sealed with wild banana leaves, and roasted uniformly over glowing embers until smoky and succulent.",
    preparationMethodBn: "\u09A6\u09C7\u09B6\u09BF \u09AE\u09C1\u09B0\u0997\u09BF\u09B0 \u09AE\u09BE\u0982\u09B8 \u09A6\u09C7\u09B6\u09BF \u09AE\u09B6\u09B2\u09BE\u09AF\u09BC \u09AE\u09C7\u0996\u09C7 \u0995\u099A\u09BF \u09AC\u09BE\u0981\u09B6\u09C7\u09B0 \u09A8\u09B2\u09C7 \u09AD\u09B0\u09C7 \u0995\u09B2\u09BE\u09AA\u09BE\u09A4\u09BE \u09A6\u09BF\u09AF\u09BC\u09C7 \u09AE\u09C1\u0996 \u09AC\u09A8\u09CD\u09A7 \u0995\u09B0\u09C7 \u09A7\u09BF\u09AE\u09C7 \u0995\u09BE\u09A0\u0995\u09AF\u09BC\u09B2\u09BE\u09B0 \u0986\u0997\u09C1\u09A8\u09C7 \u0998\u09C1\u09B0\u09BF\u09AF\u09BC\u09C7 \u0998\u09C1\u09B0\u09BF\u09AF\u09BC\u09C7 \u09AA\u09CB\u09A1\u09BC\u09BE\u09A8\u09CB \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented in Chittagong Hill Tracts indigenous cultural research and featured prominently in national tourism gastronomic profiles.",
    historicalContextBn: "\u09AA\u09BE\u09B0\u09CD\u09AC\u09A4\u09CD\u09AF \u099A\u099F\u09CD\u099F\u0997\u09CD\u09B0\u09BE\u09AE\u09C7\u09B0 \u0986\u09A6\u09BF\u09AC\u09BE\u09B8\u09C0 \u099C\u09A8\u0997\u09CB\u09B7\u09CD\u09A0\u09C0\u09B0 \u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8 \u09B0\u09A8\u09CD\u09A7\u09A8\u09AA\u09A6\u09CD\u09A7\u09A4\u09BF, \u09AF\u09C7\u0996\u09BE\u09A8\u09C7 \u09A7\u09BE\u09A4\u09AC \u09A4\u09C8\u099C\u09B8\u09AA\u09A4\u09CD\u09B0 \u099B\u09BE\u09A1\u09BC\u09BE \u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995\u09AD\u09BE\u09AC\u09C7 \u09AC\u09BE\u0981\u09B6 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u0995\u09B0\u09C7 \u09B0\u09BE\u09A8\u09CD\u09A8\u09BE \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    primarySource: "Chittagong Hill Tracts Cultural Heritage Institute & CHT Regional Council",
    citationSources: [
      "The Daily Star: Authentic Flavours of the Hill Tracts",
      "Dhaka Tribune Travel: Indigenous Culinary Treasures of Rangamati",
      "Rangamati Hill District Council Cultural Records"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Smoldering green bamboo hollow cut open to reveal aromatic golden chicken pieces garnished with mountain herbs.",
    imageAttribution: "Chittagong Hill Tracts Indigenous Heritage Archive"
  },
  khagrachhari: {
    districtId: "khagrachhari",
    districtNameEn: "Khagrachhari",
    districtNameBn: "\u0996\u09BE\u0997\u09DC\u09BE\u099B\u09DC\u09BF",
    divisionId: "chattogram",
    divisionNameEn: "Chattogram",
    foodNameEn: "Traditional Pachon (Bizu Festival 30-Herb Stew)",
    foodNameBn: "\u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AC\u09BF\u099C\u09C1 \u0989\u09CE\u09B8\u09AC\u09C7\u09B0 \u09AA\u09BE\u099C\u09A8 \u09A4\u09B0\u0995\u09BE\u09B0\u09BF",
    category: "traditional",
    dietaryType: "veg",
    approximatePriceBdt: 180,
    shortDescriptionBn: "\u099A\u09BE\u0995\u09AE\u09BE \u0993 \u09A4\u09CD\u09B0\u09BF\u09AA\u09C1\u09B0\u09BE \u09B8\u09AE\u09CD\u09AA\u09CD\u09B0\u09A6\u09BE\u09AF\u09BC\u09C7\u09B0 \u09AC\u09B0\u09CD\u09B7\u09AC\u09B0\u09A3 \u09AC\u09BF\u099C\u09C1 \u0993 \u09AC\u09C8\u09B8\u09C1 \u0989\u09CE\u09B8\u09AC\u09C7 \u09AA\u09BE\u09B9\u09BE\u09A1\u09BC\u09BF \u099C\u0999\u09CD\u0997\u09B2 \u09A5\u09C7\u0995\u09C7 \u09B8\u0982\u0997\u09C3\u09B9\u09C0\u09A4 \u09E9\u09E8 \u09AA\u09A6\u09C7\u09B0 \u09AD\u09C7\u09B7\u099C \u0993 \u09B8\u09AC\u099C\u09BF\u09B0 \u09AA\u09C1\u09B7\u09CD\u099F\u09BF\u0995\u09B0 \u09AA\u09BE\u099C\u09A8\u0964",
    shortDescriptionEn: "Heirloom botanical stew cooked with over thirty varieties of wild mountain greens, roots, and bamboo shoots during the indigenous Bizu and Boisu festivals.",
    detailedDescriptionBn: "\u0996\u09BE\u0997\u09A1\u09BC\u09BE\u099B\u09A1\u09BC\u09BF\u09B0 \u099A\u09BE\u0995\u09AE\u09BE, \u09A4\u09CD\u09B0\u09BF\u09AA\u09C1\u09B0\u09BE \u0993 \u09AE\u09BE\u09B0\u09AE\u09BE \u0986\u09A6\u09BF\u09AC\u09BE\u09B8\u09C0\u09A6\u09C7\u09B0 \u0995\u09BE\u099B\u09C7 \u2018\u09AA\u09BE\u099C\u09A8\u2019 \u09B6\u09C1\u09A7\u09C1 \u098F\u0995\u099F\u09BF \u0996\u09BE\u09AC\u09BE\u09B0 \u09A8\u09AF\u09BC, \u098F\u099F\u09BF \u09B2\u09CB\u0995\u09B8\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF\u09B0 \u0985\u09AC\u09BF\u099A\u09CD\u099B\u09C7\u09A6\u09CD\u09AF \u0985\u0982\u09B6\u0964 \u099A\u09C8\u09A4\u09CD\u09B0 \u09B8\u0982\u0995\u09CD\u09B0\u09BE\u09A8\u09CD\u09A4\u09BF \u0993 \u09AC\u09BF\u099C\u09C1 \u0989\u09CE\u09B8\u09AC\u09C7 \u09AA\u09BE\u09B9\u09BE\u09A1\u09BC \u0993 \u099C\u0999\u09CD\u0997\u09B2 \u09A5\u09C7\u0995\u09C7 \u0995\u09AE\u09AA\u0995\u09CD\u09B7\u09C7 \u09E9\u09E8 \u09A7\u09B0\u09A8\u09C7\u09B0 (\u0995\u0996\u09A8\u0993 \u0995\u0996\u09A8\u0993 \u09B6\u09A4\u09BE\u09A7\u09BF\u0995) \u09AC\u09C1\u09A8\u09CB \u09B6\u09BE\u0995, \u0995\u099A\u09BF \u09AC\u09BE\u0981\u09B6\u0995\u09CB\u09A1\u09BC\u09B2 (\u09B9\u09C7\u09AC\u09BE\u0982), \u0995\u09BE\u0981\u09A0\u09BE\u09B2\u09C7\u09B0 \u098F\u0981\u099A\u09CB\u09A1\u09BC \u0993 \u09AD\u09C7\u09B7\u099C \u09AA\u09BE\u09A4\u09BE \u09B8\u0982\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u09AC\u09BF\u09B6\u09C7\u09B7 \u09B8\u09C1\u09AC\u09BE\u09B8\u09BF\u09A4 \u09AE\u09B6\u09B2\u09BE\u09AF\u09BC \u098F\u0987 \u09B8\u09C1\u09B7\u09AE \u0993 \u0994\u09B7\u09A7\u09BF \u09A4\u09B0\u0995\u09BE\u09B0\u09BF \u09B0\u09BE\u09A8\u09CD\u09A8\u09BE \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    detailedDescriptionEn: "Pachon (also spelled Pajon) is a celebrated botanical stew of Khagrachhari prepared during Bizu and Boisu spring festivals. Indigenous women forage over 30 distinct varieties of forest greens, bamboo shoots, wild yams, tender jackfruit, and medicinal herbs. It is cooked into a hearty, aromatic stew believed to detoxify and invigorate for the coming year.",
    ingredients: ["\u0995\u099A\u09BF \u09AC\u09BE\u0981\u09B6\u0995\u09CB\u09A1\u09BC\u09B2 (Bamboo Shoots)", "\u0995\u09BE\u0981\u099A\u09BE \u0995\u09BE\u0981\u09A0\u09BE\u09B2 (Tender Jackfruit)", "\u09AA\u09BE\u09B9\u09BE\u09A1\u09BC\u09BF \u09B6\u09BE\u0995 \u0993 \u09AD\u09C7\u09B7\u099C \u09AA\u09BE\u09A4\u09BE (Wild Mountain Herbs & Greens)", "\u09AA\u09BE\u09B9\u09BE\u09A1\u09BC\u09BF \u0986\u09B2\u09C1 \u0993 \u09A1\u09BE\u0981\u099F\u09BE (Indigenous Yams & Stems)", "\u09B9\u09B2\u09C1\u09A6 \u0993 \u0995\u09BE\u0981\u099A\u09BE \u09AE\u09B0\u09BF\u099A (Turmeric & Wild Bird-Eye Chilies)"],
    preparationMethodEn: "Foraged wild vegetables are cleansed, parboiled sequentially according to density, and tempered with mustard oil, mountain turmeric, crushed ginger, and fiery hill chilies.",
    preparationMethodBn: "\u09AA\u09BE\u09B9\u09BE\u09A1\u09BC \u09A5\u09C7\u0995\u09C7 \u09B8\u0982\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09BE \u09A8\u09BE\u09A8\u09BE\u09A8 \u099C\u09BE\u09A4\u09C7\u09B0 \u09B6\u09BE\u0995 \u0993 \u09B8\u09AC\u099C\u09BF \u09AA\u09B0\u09BF\u09B7\u09CD\u0995\u09BE\u09B0 \u0995\u09B0\u09C7 \u098F\u0995\u09C7 \u098F\u0995\u09C7 \u09B8\u09C7\u09A6\u09CD\u09A7 \u0995\u09B0\u09C7 \u0996\u09BE\u0981\u099F\u09BF \u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2\u09C7 \u0986\u09A6\u09BE, \u09B9\u09B2\u09C1\u09A6 \u0993 \u09AA\u09BE\u09B9\u09BE\u09A1\u09BC\u09BF \u09AE\u09B0\u09BF\u099A\u09C7 \u09AE\u09C7\u0996\u09C7 \u09B0\u09BE\u09A8\u09CD\u09A8\u09BE \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented extensively in Bangladesh anthropological studies and indigenous cultural festival documentation.",
    historicalContextBn: "\u09AA\u09BE\u09B0\u09CD\u09AC\u09A4\u09CD\u09AF \u099A\u099F\u09CD\u099F\u0997\u09CD\u09B0\u09BE\u09AE\u09C7\u09B0 \u09AC\u09BF\u099C\u09C1 \u0993 \u09AC\u09C8\u09B8\u09BE\u09AC\u09C0 \u0989\u09CE\u09B8\u09AC\u09C7\u09B0 \u0985\u09A8\u09CD\u09AF\u09A4\u09AE \u09AA\u09CD\u09B0\u09A7\u09BE\u09A8 \u09B8\u09BE\u09AE\u09BE\u099C\u09BF\u0995 \u0993 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0996\u09BE\u09A6\u09CD\u09AF\u0964",
    primarySource: "Khagrachhari Tribal Cultural Institute Documentation",
    citationSources: [
      "Khagrachhari Tribal Cultural Institute Bulletin",
      "Banglapedia: Bizu Festival & Indigenous Food Customs",
      "The Daily Star: The Healing Herbs of Indigenous Pachon"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "A vibrant earthen bowl filled with Pachon containing bamboo shoots, wild ferns, and mountain vegetables in a lightly spiced broth.",
    imageAttribution: "Tribal Cultural Institute Khagrachhari"
  },
  naogaon: {
    districtId: "naogaon",
    districtNameEn: "Naogaon",
    districtNameBn: "\u09A8\u0993\u0997\u09BE\u0981",
    divisionId: "rajshahi",
    divisionNameEn: "Rajshahi",
    foodNameEn: "Naogaon Pera Sandesh (Centennial Milk Sweet)",
    foodNameBn: "\u09A8\u0993\u0997\u09BE\u0981\u09B0 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AA\u09CD\u09AF\u09BE\u09B0\u09BE \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6",
    category: "sweets_pitha",
    dietaryType: "sweet",
    approximatePriceBdt: 450,
    shortDescriptionBn: "\u09AC\u09BF\u09B6\u09C1\u09A6\u09CD\u09A7 \u0995\u09CD\u09B7\u09C0\u09B0 \u0993 \u099A\u09BF\u09A8\u09BF \u09A6\u09BF\u09AF\u09BC\u09C7 \u09B6\u09A4\u09BE\u09AC\u09CD\u09A6\u09C0 \u09AA\u09C2\u09B0\u09CD\u09AC\u09C7 \u09A4\u09C8\u09B0\u09BF \u09A8\u0993\u0997\u09BE\u0981\u09B0 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u0993 \u09A6\u09C0\u09B0\u09CD\u0998\u09B8\u09CD\u09A5\u09BE\u09AF\u09BC\u09C0 \u09B9\u09BE\u09B2\u0995\u09BE \u09AC\u09BE\u09A6\u09BE\u09AE\u09BF \u09B0\u0999\u09C7\u09B0 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u09AA\u09CD\u09AF\u09BE\u09B0\u09BE \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6\u0964",
    shortDescriptionEn: "Centennial light-brown dry milk sweet hand-rolled from slow-reduced kheer by the historic confectioners of Naogaon.",
    detailedDescriptionBn: "\u09A8\u0993\u0997\u09BE\u0981 \u09B6\u09B9\u09B0\u09C7\u09B0 \u09AA\u09CD\u09B0\u09BE\u09AF\u09BC \u09B6\u09A4\u09AC\u09B0\u09CD\u09B7 \u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8 \u09B9\u09B2\u09CB \u09AA\u09CD\u09AF\u09BE\u09B0\u09BE \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6\u0964 \u09AE\u09B9\u09C7\u09A8\u09CD\u09A6\u09CD\u09B0\u09A8\u09BE\u09A5 \u09A6\u09BE\u09B8 \u09A8\u09BE\u09AE\u0995 \u098F\u0995 \u09AE\u09AF\u09BC\u09B0\u09BE \u098F\u0987 \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6 \u09AA\u09CD\u09B0\u09A5\u09AE \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4 \u0995\u09B0\u09C7\u09A8\u0964 \u0996\u09BE\u0981\u099F\u09BF \u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7 \u09A6\u09C0\u09B0\u09CD\u0998\u0995\u09CD\u09B7\u09A3 \u099C\u09CD\u09AC\u09BE\u09B2 \u09A6\u09BF\u09AF\u09BC\u09C7 \u0998\u09A8 \u0995\u09CD\u09B7\u09C0\u09B0 \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC \u098F\u09AC\u0982 \u09A4\u09BE\u09A4\u09C7 \u099A\u09BF\u09A8\u09BF \u09AE\u09BF\u09B6\u09BF\u09AF\u09BC\u09C7 \u09B9\u09BE\u09A4\u09C7\u09B0 \u09A4\u09BE\u09B2\u09C1\u09A4\u09C7 \u099A\u09C7\u09AA\u09C7 \u0986\u0999\u09C1\u09B2\u09C7\u09B0 \u0986\u0995\u09C3\u09A4\u09BF\u09A4\u09C7 \u099B\u09CB\u099F \u099B\u09CB\u099F \u09AA\u09CD\u09AF\u09BE\u09B0\u09BE \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964 \u0995\u09CB\u09A8\u09CB \u09AA\u09CD\u09B0\u0995\u09BE\u09B0 \u099C\u09B2\u09C0\u09AF\u09BC \u0985\u0982\u09B6 \u09A8\u09BE \u09A5\u09BE\u0995\u09BE\u09AF\u09BC \u098F\u099F\u09BF \u09B8\u09BE\u09A7\u09BE\u09B0\u09A3 \u09A4\u09BE\u09AA\u09AE\u09BE\u09A4\u09CD\u09B0\u09BE\u09AF\u09BC \u09E7\u09E6-\u09E7\u09EB \u09A6\u09BF\u09A8 \u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3 \u09AD\u09BE\u09B2\u09CB \u09A5\u09BE\u0995\u09C7\u0964",
    detailedDescriptionEn: "Naogaon Pera Sandesh is a historic dry milk confection created over a century ago by confectioner Mahendra Das. Fresh local cow milk is reduced over continuous fire for hours to produce dense golden kheer, sweetened lightly with sugar, and rolled by hand into small finger-length cylinders. Completely moisture-free, it stays fresh for weeks without preservatives.",
    ingredients: ["\u0996\u09BE\u0981\u099F\u09BF \u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7\u09C7\u09B0 \u0995\u09CD\u09B7\u09C0\u09B0 (Condensed Cow Milk Kheer)", "\u099A\u09BF\u09A8\u09BF (Cane Sugar)", "\u0998\u09BF (Pure Desi Ghee)"],
    preparationMethodEn: "Fresh whole milk is simmered in cast-iron cauldrons for several hours until thick fudge-like kheer forms, which is kneaded with sugar and rolled into smooth cylindrical pieces.",
    preparationMethodBn: "\u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7 \u099C\u09CD\u09AC\u09BE\u09B2 \u09A6\u09BF\u09DF\u09C7 \u0998\u09A8 \u0995\u09CD\u09B7\u09C0\u09B0 \u09AC\u09BE\u09A8\u09BF\u09AF\u09BC\u09C7 \u099A\u09BF\u09A8\u09BF \u09AE\u09BF\u09B6\u09BF\u09AF\u09BC\u09C7 \u09B9\u09BE\u09A4\u09C7\u09B0 \u09A4\u09BE\u09B2\u09C1\u09A4\u09C7 \u0998\u09B7\u09C7 \u0986\u0999\u09C1\u09B2\u09C7\u09B0 \u09AE\u09A4\u09CB \u099B\u09CB\u099F \u099B\u09CB\u099F \u0997\u09CB\u09B2\u09BE\u0995\u09C3\u09A4\u09BF \u09AA\u09CD\u09AF\u09BE\u09B0\u09BE \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Historically offered as temple prasad at local heritage shrines before becoming Northern Bengal\u2019s signature dry sweetmeat.",
    historicalContextBn: "\u09B6\u09A4\u09BE\u09AC\u09CD\u09A6\u09C0 \u09AA\u09C2\u09B0\u09CD\u09AC\u09C7 \u09AA\u09C2\u099C\u09BE\u09B0 \u09AA\u09CD\u09B0\u09B8\u09BE\u09A6 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09B6\u09C1\u09B0\u09C1 \u09B9\u09B2\u09C7\u0993 \u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8\u09C7 \u09A8\u0993\u0997\u09BE\u0981\u09B0 \u09AA\u09CD\u09B0\u09A7\u09BE\u09A8 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09A6\u09C7\u09B6-\u09AC\u09BF\u09A6\u09C7\u09B6\u09C7 \u09B8\u09AE\u09BE\u09A6\u09C3\u09A4\u0964",
    primarySource: "Naogaon District Administration Cultural Portal & DAE Heritage Report",
    citationSources: [
      "The Financial Express: The unique taste and heritage of Naogaon Pera Sandesh",
      "The Business Standard: Century-old Pera Sandesh of Naogaon",
      "Naogaon District Administration Cultural Registry"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Dry, light-brown cylindrical Pera Sandesh sweets neatly stacked on a traditional handloom fabric background.",
    imageAttribution: "Naogaon Confectionery Artisans Association"
  },
  joypurhat: {
    districtId: "joypurhat",
    districtNameEn: "Joypurhat",
    districtNameBn: "\u099C\u09DF\u09AA\u09C1\u09B0\u09B9\u09BE\u099F",
    divisionId: "rajshahi",
    divisionNameEn: "Rajshahi",
    foodNameEn: "Panchbibi Lotiraj Taro (Kochur Loti) Delicacies",
    foodNameBn: "\u09AA\u09BE\u0981\u099A\u09AC\u09BF\u09AC\u09BF\u09B0 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u09B2\u09A4\u09BF\u09B0\u09BE\u099C \u0995\u099A\u09C1\u09B0 \u09B2\u09A4\u09BF \u0993 \u09B6\u09C1\u0981\u099F\u0995\u09BF \u09AD\u09C1\u09A8\u09BE",
    category: "traditional",
    dietaryType: "non-veg",
    approximatePriceBdt: 150,
    shortDescriptionBn: "\u099C\u09AF\u09BC\u09AA\u09C1\u09B0\u09B9\u09BE\u099F\u09C7\u09B0 \u09AA\u09BE\u0981\u099A\u09AC\u09BF\u09AC\u09BF\u09B0 \u09AD\u09CC\u0997\u09CB\u09B2\u09BF\u0995 \u0996\u09CD\u09AF\u09BE\u09A4\u09BF\u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09B2\u09A4\u09BF\u09B0\u09BE\u099C \u0995\u099A\u09C1\u09B0 \u09B2\u09A4\u09BF\u09B0 \u09B8\u09B0\u09CD\u09B7\u09C7-\u09B0\u09B8\u09C1\u09A8 \u0993 \u099A\u09BF\u0982\u09A1\u09BC\u09BF/\u09B6\u09C1\u0981\u099F\u0995\u09BF \u09A6\u09BF\u09AF\u09BC\u09C7 \u0985\u09A8\u09A8\u09CD\u09AF \u09AD\u09C1\u09A8\u09BE\u0964",
    shortDescriptionEn: "Celebrated Lotiraj taro stolons from Panchbibi stir-fried with mustard paste, garlic, and dried fish or river prawns.",
    detailedDescriptionBn: "\u099C\u09AF\u09BC\u09AA\u09C1\u09B0\u09B9\u09BE\u099F\u09C7\u09B0 \u09AA\u09BE\u0981\u099A\u09AC\u09BF\u09AC\u09BF \u0989\u09AA\u099C\u09C7\u09B2\u09BE \u09B8\u09BE\u09B0\u09BE \u09A6\u09C7\u09B6\u09C7 \u2018\u09B2\u09A4\u09BF\u09B0\u09BE\u099C\u2019 \u0995\u099A\u09C1\u09B0 \u099C\u09A8\u09CD\u09AF \u09B8\u09C1\u09AA\u09B0\u09BF\u099A\u09BF\u09A4 \u098F\u09AC\u0982 \u098F\u0987 \u09AC\u09CD\u09B0\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1 \u09B6\u09B8\u09CD\u09AF\u099F\u09BF \u0986\u09A8\u09CD\u09A4\u09B0\u09CD\u099C\u09BE\u09A4\u09BF\u0995\u09AD\u09BE\u09AC\u09C7\u0993 \u09B0\u09AA\u09CD\u09A4\u09BE\u09A8\u09BF \u09B9\u09AF\u09BC\u0964 \u098F\u0996\u09BE\u09A8\u0995\u09BE\u09B0 \u09A6\u09CB\u0986\u0981\u09B6 \u09AE\u09BE\u099F\u09BF\u09A4\u09C7 \u0989\u09CE\u09AA\u09BE\u09A6\u09BF\u09A4 \u09B2\u09A4\u09BF\u09B0\u09BE\u099C \u0995\u099A\u09C1\u09B0 \u09B2\u09A4\u09BF \u0985\u09A4\u09CD\u09AF\u09A8\u09CD\u09A4 \u09AE\u09B8\u09C3\u09A3, \u0986\u0981\u09B6\u09B9\u09C0\u09A8 \u098F\u09AC\u0982 \u0997\u09B2\u09BE \u099A\u09C1\u09B2\u0995\u09BE\u09AF\u09BC \u09A8\u09BE\u0964 \u0996\u09BE\u0981\u099F\u09BF \u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2, \u09B0\u09B8\u09C1\u09A8 \u09AC\u09BE\u099F\u09BE \u0993 \u099A\u09BF\u0982\u09A1\u09BC\u09BF \u09AC\u09BE \u09B6\u09C1\u0981\u099F\u0995\u09BF \u09A6\u09BF\u09AF\u09BC\u09C7 \u0995\u09A1\u09BC\u09BE \u09AD\u09C1\u09A8\u09BE \u09A4\u09B0\u0995\u09BE\u09B0\u09BF \u09AC\u09B0\u09C7\u09A8\u09CD\u09A6\u09CD\u09B0 \u0985\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u098F\u0995 \u0985\u09A8\u09AC\u09A6\u09CD\u09AF \u0996\u09BE\u09AC\u09BE\u09B0\u0964",
    detailedDescriptionEn: "Panchbibi in Joypurhat is the recognized origin of the Bari Lotiraj-1 taro variety, acclaimed for its crisp yet tender, itch-free stolons that are exported worldwide. Cooked traditionally with pungent mustard paste, abundant crushed garlic, green chilies, and sun-dried fish or freshwater prawns, it is a staple of North Bengal.",
    ingredients: ["\u09B2\u09A4\u09BF\u09B0\u09BE\u099C \u0995\u099A\u09C1\u09B0 \u09B2\u09A4\u09BF (Lotiraj Taro Stolons)", "\u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2 \u0993 \u09AC\u09BE\u099F\u09BE (Mustard Oil & Paste)", "\u09B0\u09B8\u09C1\u09A8 \u0993 \u09AA\u09C7\u0981\u09AF\u09BC\u09BE\u099C \u0995\u09C1\u099A\u09BF (Garlic & Onion)", "\u099A\u09BF\u0982\u09A1\u09BC\u09BF \u0985\u09A5\u09AC\u09BE \u09B6\u09C1\u0981\u099F\u0995\u09BF (Prawns or Dried Fish)", "\u0995\u09BE\u0981\u099A\u09BE \u09AE\u09B0\u09BF\u099A \u0993 \u09B9\u09B2\u09C1\u09A6 (Green Chilies & Turmeric)"],
    preparationMethodEn: "Taro stolons are cleaned, parboiled with a pinch of salt and turmeric, drained, and stir-fried in mustard oil with plenty of garlic, cumin, and shrimp until tender and aromatic.",
    preparationMethodBn: "\u09B2\u09A4\u09BF \u09AA\u09B0\u09BF\u09B7\u09CD\u0995\u09BE\u09B0 \u0995\u09B0\u09C7 \u09B8\u09BE\u09AE\u09BE\u09A8\u09CD\u09AF \u09AD\u09BE\u09AA\u09BF\u09AF\u09BC\u09C7 \u099C\u09B2 \u099D\u09B0\u09BF\u09AF\u09BC\u09C7 \u09A8\u09C7\u0993\u09AF\u09BC\u09BE \u09B9\u09AF\u09BC\u0964 \u098F\u09B0\u09AA\u09B0 \u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2\u09C7 \u09B0\u09B8\u09C1\u09A8, \u09AA\u09C7\u0981\u09AF\u09BC\u09BE\u099C \u0993 \u099A\u09BF\u0982\u09A1\u09BC\u09BF \u09A6\u09BF\u09AF\u09BC\u09C7 \u0995\u09A1\u09BC\u09BE \u0995\u09B7\u09BF\u09AF\u09BC\u09C7 \u09AE\u09BE\u0996\u09BE \u09AE\u09BE\u0996\u09BE \u0995\u09B0\u09C7 \u09AD\u09C1\u09A8\u09BE \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented by the Bangladesh Agricultural Research Institute (BARI) and Joypurhat District Administration as the district\u2019s premier brand crop.",
    historicalContextBn: "\u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6 \u0995\u09C3\u09B7\u09BF \u0997\u09AC\u09C7\u09B7\u09A3\u09BE \u0987\u09A8\u09B8\u09CD\u099F\u09BF\u099F\u09BF\u0989\u099F \u0993 \u099C\u09AF\u09BC\u09AA\u09C1\u09B0\u09B9\u09BE\u099F \u099C\u09C7\u09B2\u09BE \u09AA\u09CD\u09B0\u09B6\u09BE\u09B8\u09A8\u09C7\u09B0 \u09B8\u09CD\u09AC\u09C0\u0995\u09C3\u09A4 \u09AC\u09CD\u09B0\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1 \u09B6\u09B8\u09CD\u09AF \u0993 \u0986\u099E\u09CD\u099A\u09B2\u09BF\u0995 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u0964",
    primarySource: "Bangladesh Agricultural Research Institute (BARI) & Joypurhat District Administration",
    citationSources: [
      "The Daily Star Agrarian Report: Panchbibi\u2019s Lotiraj taro goes global",
      "Bangladesh Agricultural Research Institute (BARI) Varietal Study: Bari Lotiraj-1",
      "Joypurhat District Portal (Agriculture & Economy)"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Stir-fried green taro stolons glistening with mustard oil and speckled with tiny pink prawns and golden garlic cloves.",
    imageAttribution: "Department of Agricultural Extension / Foodie BD Archive"
  },
  jhenaidah: {
    districtId: "jhenaidah",
    districtNameEn: "Jhenaidah",
    districtNameBn: "\u099D\u09BF\u09A8\u09BE\u0987\u09A6\u09B9",
    divisionId: "khulna",
    divisionNameEn: "Khulna",
    foodNameEn: "Kotchandpur Khejur Gurer Sandesh & Patali",
    foodNameBn: "\u0995\u09CB\u099F\u099A\u09BE\u0981\u09A6\u09AA\u09C1\u09B0\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0996\u09BE\u0981\u099F\u09BF \u0996\u09C7\u099C\u09C1\u09B0 \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09AA\u09BE\u09A4\u09BE\u09B2\u09BF \u0993 \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6",
    category: "sweets_pitha",
    dietaryType: "sweet",
    approximatePriceBdt: 420,
    shortDescriptionBn: "\u0995\u09AA\u09CB\u09A4\u09BE\u0995\u09CD\u09B7 \u0985\u09AC\u09AC\u09BE\u09B9\u09BF\u0995\u09BE\u09B0 \u0995\u09CB\u099F\u099A\u09BE\u0981\u09A6\u09AA\u09C1\u09B0\u09C7\u09B0 \u09B6\u09A4\u09AC\u09B0\u09CD\u09B7\u09C0 \u09B8\u09C1\u09AC\u09BE\u09B8\u09BF\u09A4 \u09B6\u0995\u09CD\u09A4 \u0996\u09C7\u099C\u09C1\u09B0\u09C7\u09B0 \u09AA\u09BE\u09A4\u09BE\u09B2\u09BF \u0997\u09C1\u09A1\u09BC \u0993 \u0996\u09BE\u0981\u099F\u09BF \u0995\u09CD\u09B7\u09C0\u09B0 \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6\u0964",
    shortDescriptionEn: "Heirloom crystalline date palm patali jaggery and rich kheer sandesh from the historic sugar hub of Kotchandpur.",
    detailedDescriptionBn: "\u099D\u09BF\u09A8\u09BE\u0987\u09A6\u09B9\u09C7\u09B0 \u0995\u09CB\u099F\u099A\u09BE\u0981\u09A6\u09AA\u09C1\u09B0 \u0985\u09AC\u09BF\u09AD\u0995\u09CD\u09A4 \u09AC\u09BE\u0982\u09B2\u09BE\u09B0 \u0985\u09A8\u09CD\u09AF\u09A4\u09AE \u09AA\u09CD\u09B0\u09A7\u09BE\u09A8 \u099A\u09BF\u09A8\u09BF \u0993 \u0996\u09C7\u099C\u09C1\u09B0 \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09AC\u09BE\u09A3\u09BF\u099C\u09CD\u09AF \u0995\u09C7\u09A8\u09CD\u09A6\u09CD\u09B0 \u099B\u09BF\u09B2\u0964 \u098F\u0996\u09BE\u09A8\u0995\u09BE\u09B0 \u0997\u09BE\u099B\u09BF\u09A6\u09C7\u09B0 \u09A4\u09C8\u09B0\u09BF \u0996\u09BE\u0981\u099F\u09BF \u0996\u09C7\u099C\u09C1\u09B0 \u09B0\u09B8\u09C7\u09B0 \u09AA\u09BE\u09A4\u09BE\u09B2\u09BF \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09B8\u09C1\u09AC\u09BE\u09B8 \u0993 \u09A6\u09BE\u09A8\u09BE\u09A6\u09BE\u09B0 \u0997\u09A0\u09A8 \u0985\u09A8\u09A8\u09CD\u09AF\u0964 \u098F\u0987 \u0997\u09C1\u09A1\u09BC \u0996\u09BE\u0981\u099F\u09BF \u09A6\u09C1\u09A7\u09C7\u09B0 \u099B\u09BE\u09A8\u09BE\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AE\u09BF\u09B6\u09BF\u09AF\u09BC\u09C7 \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC \u09B6\u09C0\u09A4\u0995\u09BE\u09B2\u09C0\u09A8 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0996\u09C7\u099C\u09C1\u09B0 \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6\u0964",
    detailedDescriptionEn: "Kotchandpur in Jhenaidah was historically one of Bengal\u2019s premier trading hubs for refined date palm jaggery. Renowned for its firm, crystalline patali slabs made from winter date-palm sap, local confectioners craft melt-in-the-mouth sandesh and pithas that define the regional winter palate.",
    ingredients: ["\u0996\u09BE\u0981\u099F\u09BF \u0996\u09C7\u099C\u09C1\u09B0\u09C7\u09B0 \u09B0\u09B8 (Fresh Date Palm Sap)", "\u09A6\u09C7\u09B6\u09BF \u09A6\u09C1\u09A7\u09C7\u09B0 \u099B\u09BE\u09A8\u09BE (Cow Milk Chhana)", "\u0998\u09BF (Desi Ghee)"],
    preparationMethodEn: "Winter date sap is reduced over wood stoves to crystallization point, pressed into circular wooden earthenware molds to set into firm patali, and blended with fresh chhana for sandesh.",
    preparationMethodBn: "\u09B6\u09C0\u09A4\u09C7\u09B0 \u09B8\u0995\u09BE\u09B2\u09C7 \u09B8\u0982\u0997\u09C3\u09B9\u09C0\u09A4 \u09B0\u09B8 \u099C\u09CD\u09AC\u09BE\u09B2 \u09A6\u09BF\u09DF\u09C7 \u099C\u09AE\u09BE\u099F \u09AC\u09BE\u0981\u09A7\u09BE\u09B0 \u09AE\u09C1\u09B9\u09C2\u09B0\u09CD\u09A4\u09C7 \u09AE\u09BE\u099F\u09BF\u09B0 \u09AC\u09BE \u0995\u09BE\u09A0\u09C7\u09B0 \u09AA\u09BE\u09A4\u09CD\u09B0\u09C7 \u09A2\u09C7\u09B2\u09C7 \u09B6\u0995\u09CD\u09A4 \u09AA\u09BE\u09A4\u09BE\u09B2\u09BF \u0997\u09C1\u09A1\u09BC \u0993 \u09A4\u09BE \u09A5\u09C7\u0995\u09C7 \u099B\u09BE\u09A8\u09BE\u09B0 \u09B8\u09A8\u09CD\u09A6\u09C7\u09B6 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Historically documented in British colonial industrial surveys as Bengal\u2019s foremost center for indigenous date sugar manufacturing.",
    historicalContextBn: "\u0989\u09A8\u09BF\u09B6 \u09B6\u09A4\u0995\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09BE\u09B8\u09BF\u0995 \u0997\u09CD\u09AF\u09BE\u099C\u09C7\u099F\u09BF\u09AF\u09BC\u09BE\u09B0 \u0993 \u099C\u09C7\u09B2\u09BE \u09A8\u09A5\u09BF\u09AA\u09A4\u09CD\u09B0\u09C7 \u0995\u09CB\u099F\u099A\u09BE\u0981\u09A6\u09AA\u09C1\u09B0\u09C7\u09B0 \u099A\u09BF\u09A8\u09BF \u0993 \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09AC\u09BF\u09B8\u09CD\u09A4\u09C3\u09A4 \u09AC\u09BE\u09A3\u09BF\u099C\u09CD\u09AF\u09C7\u09B0 \u0987\u09A4\u09BF\u09B9\u09BE\u09B8 \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09BF\u09A4 \u09B0\u09AF\u09BC\u09C7\u099B\u09C7\u0964",
    primarySource: "Jhenaidah District Gazetteer & Historical Sugar Industry Archives",
    citationSources: [
      "Jhenaidah District Administration Cultural Records",
      "Banglapedia: History of Kotchandpur Sugar & Jaggery Trade",
      "Bengal Agricultural Journal Archives"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Firm, golden-amber hexagonal discs of date palm patali jaggery beside delicate sandesh on an embroidered Nakshi Kantha.",
    imageAttribution: "Southwestern Bengal Agrarian History Archive"
  },
  magura: {
    districtId: "magura",
    districtNameEn: "Magura",
    districtNameBn: "\u09AE\u09BE\u0997\u09C1\u09B0\u09BE",
    divisionId: "khulna",
    divisionNameEn: "Khulna",
    foodNameEn: "Khamarpara Doi & GI Hajrapuri Litchi",
    foodNameBn: "\u0996\u09BE\u09AE\u09BE\u09B0\u09AA\u09BE\u09A1\u09BC\u09BE\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09A6\u0987 \u0993 \u099C\u09BF\u0986\u0987 \u09B8\u09A8\u09A6\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4 \u09B9\u09BE\u099C\u09B0\u09BE\u09AA\u09C1\u09B0\u09C7\u09B0 \u09B2\u09BF\u099A\u09C1",
    category: "dessert",
    dietaryType: "sweet",
    approximatePriceBdt: 220,
    shortDescriptionBn: "\u09B6\u09CD\u09B0\u09C0\u09AA\u09C1\u09B0\u09C7\u09B0 \u0996\u09BE\u09AE\u09BE\u09B0\u09AA\u09BE\u09A1\u09BC\u09BE\u09AF\u09BC \u09AE\u09BE\u099F\u09BF\u09B0 \u09B9\u09BE\u0981\u09A1\u09BC\u09BF\u09A4\u09C7 \u09A4\u09C8\u09B0\u09BF \u09EC\u09E6 \u09AC\u099B\u09B0\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0998\u09A8 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09A6\u0987 \u098F\u09AC\u0982 \u09B9\u09BE\u099C\u09B0\u09BE\u09AA\u09C1\u09B0\u09C7\u09B0 \u099C\u09BF\u0986\u0987 \u09B8\u09CD\u09AC\u09C0\u0995\u09C3\u09A4\u09BF\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4 \u09B0\u09B8\u09BE\u09B2\u09CB \u09B2\u09BF\u099A\u09C1\u0964",
    shortDescriptionEn: "Sixty-year-old traditional firm sweet curd from Khamarpara in Sreepur, accompanied by Magura\u2019s official GI-certified Hajrapuri litchis.",
    detailedDescriptionBn: "\u09AE\u09BE\u0997\u09C1\u09B0\u09BE \u099C\u09C7\u09B2\u09BE\u09B0 \u09B6\u09CD\u09B0\u09C0\u09AA\u09C1\u09B0 \u0989\u09AA\u099C\u09C7\u09B2\u09BE\u09B0 \u0996\u09BE\u09AE\u09BE\u09B0\u09AA\u09BE\u09A1\u09BC\u09BE \u0997\u09CD\u09B0\u09BE\u09AE\u09C7 \u099A\u09BF\u09A4\u09CD\u09A4 \u0998\u09CB\u09B7 \u09A8\u09BE\u09AE\u0995 \u09AE\u09AF\u09BC\u09B0\u09BE \u09AA\u09CD\u09B0\u09BE\u09AF\u09BC \u09EC\u09E6 \u09AC\u099B\u09B0 \u0986\u0997\u09C7 \u098F\u0987 \u09AC\u09BF\u09B6\u09C7\u09B7 \u09A6\u0987 \u09A4\u09C8\u09B0\u09BF \u09B6\u09C1\u09B0\u09C1 \u0995\u09B0\u09C7\u09A8\u0964 \u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7 \u099C\u09CD\u09AC\u09BE\u09B2 \u09A6\u09BF\u09AF\u09BC\u09C7 \u09AE\u09BE\u099F\u09BF\u09B0 \u09AA\u09BE\u09A4\u09CD\u09B0\u09C7 \u09AC\u09B8\u09BE\u09A8\u09CB \u098F\u0987 \u09A6\u0987 \u0985\u09A4\u09CD\u09AF\u09A8\u09CD\u09A4 \u0998\u09A8 \u0993 \u09AE\u09B8\u09C3\u09A3 \u09B9\u09AF\u09BC\u0964 \u098F\u099B\u09BE\u09A1\u09BC\u09BE \u09AE\u09BE\u0997\u09C1\u09B0\u09BE\u09B0 \u09B9\u09BE\u099C\u09B0\u09BE\u09AA\u09C1\u09B0\u09C7\u09B0 \u09B8\u09C1\u09AE\u09BF\u09B7\u09CD\u099F \u0993 \u09B0\u09B8\u09BE\u09B2\u09CB \u09AC\u09CB\u09AE\u09CD\u09AC\u09BE\u0987 \u0993 \u099A\u09BE\u09AF\u09BC\u09A8\u09BE \u099C\u09BE\u09A4\u09C7\u09B0 \u09B2\u09BF\u099A\u09C1 \u09B8\u09AE\u09CD\u09AA\u09CD\u09B0\u09A4\u09BF \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6 \u09B8\u09B0\u0995\u09BE\u09B0 \u0995\u09B0\u09CD\u09A4\u09C3\u0995 \u09AD\u09CC\u0997\u09CB\u09B2\u09BF\u0995 \u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6\u0995 (GI) \u09B8\u09CD\u09AC\u09C0\u0995\u09C3\u09A4\u09BF \u09B2\u09BE\u09AD \u0995\u09B0\u09C7\u099B\u09C7\u0964",
    detailedDescriptionEn: "Khamarpara Doi originated in Sreepur, Magura, created by confectioner Chitta Ghosh over six decades ago. Pure cow milk is reduced, sweetened, and cultured in unglazed clay pots that absorb moisture, yielding a firm, rich curd. Magura\u2019s renowned Hajrapuri litchi is also officially certified with Geographical Indication (GI) status.",
    ingredients: ["\u0996\u09BE\u0981\u099F\u09BF \u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7 (Pure Cow Milk)", "\u099A\u09BF\u09A8\u09BF (Cane Sugar)", "\u09A6\u0987\u09AF\u09BC\u09C7\u09B0 \u09AC\u09C0\u099C (Starter Culture)", "\u09B9\u09BE\u099C\u09B0\u09BE\u09AA\u09C1\u09B0\u09C7\u09B0 \u09B2\u09BF\u099A\u09C1 (Hajrapuri Litchi)"],
    preparationMethodEn: "Milk is boiled slowly until deep cream in color, sweetened, transferred to porous earthenware cups, and left to set undisturbed overnight.",
    preparationMethodBn: "\u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7 \u09A6\u09C0\u09B0\u09CD\u0998\u0995\u09CD\u09B7\u09A3 \u099C\u09CD\u09AC\u09BE\u09B2 \u09A6\u09BF\u09DF\u09C7 \u09B9\u09BE\u09B2\u0995\u09BE \u0995\u09CD\u09AF\u09BE\u09B0\u09BE\u09AE\u09C7\u09B2 \u09B0\u0999 \u0995\u09B0\u09C7 \u09AE\u09BE\u099F\u09BF\u09B0 \u09AA\u09BE\u09A4\u09BF\u09B2\u09C7 \u09A2\u09C7\u09B2\u09C7 \u09AA\u09C1\u09B0\u09CB\u09A8\u09CB \u09A6\u0987\u09AF\u09BC\u09C7\u09B0 \u09AC\u09C0\u099C \u09A6\u09BF\u09AF\u09BC\u09C7 \u09A2\u09C7\u0995\u09C7 \u09B8\u09BE\u09B0\u09BE\u09B0\u09BE\u09A4 \u09A4\u09BE\u09AA\u09C7 \u09B0\u09BE\u0996\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented in Dhaka Tribune gastronomic profiles and verified in official GI registries under the Ministry of Industries.",
    historicalContextBn: "\u09AE\u09BE\u0997\u09C1\u09B0\u09BE \u099C\u09C7\u09B2\u09BE \u09AA\u09CD\u09B0\u09B6\u09BE\u09B8\u09A8\u09C7\u09B0 \u09B8\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF \u09AC\u09BF\u09B7\u09AF\u09BC\u0995 \u09B6\u09BE\u0996\u09BE \u0993 \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C7\u09B0 \u09AA\u09C7\u099F\u09C7\u09A8\u09CD\u099F\u09B8, \u09A1\u09BF\u099C\u09BE\u0987\u09A8 \u0993 \u099F\u09CD\u09B0\u09C7\u09A1\u09AE\u09BE\u09B0\u09CD\u0995 \u09AC\u09BF\u09AD\u09BE\u0997 (DPDT) \u0995\u09B0\u09CD\u09A4\u09C3\u0995 \u09B8\u09CD\u09AC\u09C0\u0995\u09C3\u09A4\u0964",
    primarySource: "Department of Patents, Designs and Trademarks (DPDT) & Dhaka Tribune Cultural Profile",
    citationSources: [
      "Dhaka Tribune: The delectable legacy of Magura\u2019s Khamarpara Doi",
      "DPDT Official GI Accreditation Gazette (Hajrapuri Litchi)",
      "Magura District Administration Cultural Affairs Register"
    ],
    researchStatus: "gi_certified",
    isGiProduct: true,
    giRegistrationInfo: "Hajrapuri Litchi certified as Geographical Indication (GI) Product",
    imageSuggestionPrompt: "A clay pot filled with rich caramelized sweet curd set beside a cluster of bumpy red Hajrapuri litchis with green leaves.",
    imageAttribution: "Magura District Administration / Foodie BD Archive"
  },
  narail: {
    districtId: "narail",
    districtNameEn: "Narail",
    districtNameBn: "\u09A8\u09DC\u09BE\u0987\u09B2",
    divisionId: "khulna",
    divisionNameEn: "Khulna",
    foodNameEn: "Narail Chhit Ruti & Deshi Chitol Macher Jhol",
    foodNameBn: "\u09A8\u09A1\u09BC\u09BE\u0987\u09B2\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u099B\u09BF\u099F \u09B0\u09C1\u099F\u09BF \u0993 \u09A8\u09AC\u0997\u0999\u09CD\u0997\u09BE\u09B0 \u099A\u09BF\u09A4\u09B2 \u09AE\u09BE\u099B\u09C7\u09B0 \u099D\u09CB\u09B2",
    category: "main_course",
    dietaryType: "non-veg",
    approximatePriceBdt: 230,
    shortDescriptionBn: "\u09B9\u09BE\u09A4\u09C7\u09B0 \u0986\u0999\u09C1\u09B2 \u099B\u09BF\u099F\u09BF\u09AF\u09BC\u09C7 \u09A4\u09C8\u09B0\u09BF \u099C\u09BE\u09B2\u09BF\u0995\u09C3\u09A4\u09BF\u09B0 \u09AA\u09BE\u09A4\u09B2\u09BE \u099B\u09BF\u099F \u09B0\u09C1\u099F\u09BF \u098F\u09AC\u0982 \u09A8\u09AC\u0997\u0999\u09CD\u0997\u09BE \u0993 \u099A\u09BF\u09A4\u09CD\u09B0\u09BE \u09A8\u09A6\u09C0\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u099A\u09BF\u09A4\u09B2 \u09AE\u09BE\u099B\u09C7\u09B0 \u0995\u09B7\u09BE \u099D\u09CB\u09B2\u0964",
    shortDescriptionEn: "Delicate lacy rice-flour crepes (Chhit Ruti) scattered by hand onto hot skillets, paired with rich Chitol fish curry from the Nabaganga and Chitra rivers.",
    detailedDescriptionBn: "\u09A8\u09A1\u09BC\u09BE\u0987\u09B2\u09C7\u09B0 \u0997\u09CD\u09B0\u09BE\u09AE\u09C0\u09A3 \u099C\u09A8\u09AA\u09A6\u09C7 \u09B6\u09C0\u09A4\u09C7\u09B0 \u09B8\u0995\u09BE\u09B2\u09C7 \u09AC\u09BE \u0985\u09A4\u09BF\u09A5\u09BF \u0986\u09AA\u09CD\u09AF\u09BE\u09AF\u09BC\u09A8\u09C7 \u099B\u09BF\u099F \u09B0\u09C1\u099F\u09BF \u098F\u0995 \u0985\u09A8\u09A8\u09CD\u09AF \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u0964 \u0986\u09A4\u09AA \u099A\u09BE\u09B2\u09C7\u09B0 \u09AA\u09BE\u09A4\u09B2\u09BE \u0997\u09C1\u0981\u09A1\u09BC\u09BF\u09B0 \u0997\u09CB\u09B2\u09BE\u09AF\u09BC \u0986\u0999\u09C1\u09B2 \u09A1\u09C1\u09AC\u09BF\u09AF\u09BC\u09C7 \u0997\u09B0\u09AE \u09A4\u09BE\u0993\u09AF\u09BC\u09BE\u09AF\u09BC \u099B\u09BF\u099F\u09BF\u09AF\u09BC\u09C7 \u099B\u09BF\u099F\u09BF\u09AF\u09BC\u09C7 \u099C\u09BE\u09B2\u09C7\u09B0 \u09AE\u09A4\u09CB \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC \u098F\u0987 \u09B0\u09C1\u099F\u09BF\u0964 \u098F\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09A8\u09AC\u0997\u0999\u09CD\u0997\u09BE \u09AC\u09BE \u099A\u09BF\u09A4\u09CD\u09B0\u09BE \u09A8\u09A6\u09C0\u09B0 \u09A4\u09BE\u099C\u09BE \u099A\u09BF\u09A4\u09B2 \u09AE\u09BE\u099B\u09C7\u09B0 \u09AA\u09C7\u099F\u09BF \u09AC\u09BE \u09AE\u09C1\u0987\u09A0\u09CD\u09AF\u09BE \u09AD\u09C1\u09A8\u09BE \u09A8\u09A1\u09BC\u09BE\u0987\u09B2\u09C7\u09B0 \u09B8\u09AC\u099A\u09C7\u09AF\u09BC\u09C7 \u099C\u09A8\u09AA\u09CD\u09B0\u09BF\u09AF\u09BC \u0996\u09BE\u09A8\u09BE\u09AA\u09BF\u09A8\u09BE\u0964",
    detailedDescriptionEn: 'Chhit Ruti (literally "sprinkled bread") is an artisanal culinary tradition of rural Narail. A watery rice-flour batter is dipped with five fingers and flicked skillfully across a sizzling skillet to create a delicate, lace-like crepe. It is traditionally served alongside fresh Chitol fish curry caught from the Chitra and Nabaganga rivers.',
    ingredients: ["\u0986\u09A4\u09AA \u099A\u09BE\u09B2\u09C7\u09B0 \u0997\u09C1\u0981\u09A1\u09BC\u09BF (Sun-Dried Rice Flour)", "\u09A8\u09AC\u0997\u0999\u09CD\u0997\u09BE\u09B0 \u099A\u09BF\u09A4\u09B2 \u09AE\u09BE\u099B (Fresh River Chitol Fish)", "\u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2 (Cold-Pressed Mustard Oil)", "\u09AA\u09C7\u0981\u09AF\u09BC\u09BE\u099C \u0993 \u0986\u09A6\u09BE \u09AC\u09BE\u099F\u09BE (Onion & Ginger Paste)", "\u099C\u09BF\u09B0\u09BE \u0993 \u0997\u09B0\u09AE \u09AE\u09B6\u09B2\u09BE (Cumin & Garam Masala)"],
    preparationMethodEn: "Rice flour batter is hand-flicked onto a lightly greased cast-iron pan to form a web-like mesh, folded into quarters, and paired with slow-simmered fish curry.",
    preparationMethodBn: "\u099A\u09BE\u09B2\u09C7\u09B0 \u0997\u09C1\u0981\u09A1\u09BC\u09BF \u09AA\u09BE\u09A8\u09BF\u09A4\u09C7 \u0997\u09C1\u09B2\u09C7 \u09AA\u09BE\u09A4\u09B2\u09BE \u09AC\u09CD\u09AF\u09BE\u099F\u09BE\u09B0 \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09C7 \u0997\u09B0\u09AE \u09A4\u09BE\u0993\u09AF\u09BC\u09BE\u09AF\u09BC \u0986\u0999\u09C1\u09B2 \u09A6\u09BF\u09AF\u09BC\u09C7 \u099B\u09BF\u099F\u09BF\u09AF\u09BC\u09C7 \u099C\u09BE\u09B2\u09C7\u09B0 \u09AE\u09A4\u09CB \u09B0\u09C1\u099F\u09BF \u09AD\u09C7\u099C\u09C7 \u099A\u09BF\u09A4\u09B2 \u09AE\u09BE\u099B\u09C7\u09B0 \u099D\u09CB\u09B2\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AA\u09B0\u09BF\u09AC\u09C7\u09B6\u09A8 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Featured in The Daily Star heritage culinary archives and documented by folklore researchers as Narail\u2019s quintessential rural comfort food.",
    historicalContextBn: "\u09A8\u09A1\u09BC\u09BE\u0987\u09B2\u09C7\u09B0 \u09B2\u09CB\u0995\u09B8\u09BE\u09B9\u09BF\u09A4\u09CD\u09AF \u0993 \u099A\u09BF\u09A4\u09CD\u09B0\u09BE \u09A8\u09A6\u09C0\u09B0 \u0985\u09AC\u09AC\u09BE\u09B9\u09BF\u0995\u09BE\u09B0 \u09B6\u09A4\u09AC\u09B0\u09CD\u09B7\u09C0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0997\u09CD\u09B0\u09BE\u09AE\u09C0\u09A3 \u0996\u09BE\u09AC\u09BE\u09B0 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09AC\u09CD\u09AF\u09BE\u09AA\u0995\u09AD\u09BE\u09AC\u09C7 \u09B8\u09AE\u09BE\u09A6\u09C3\u09A4\u0964",
    primarySource: "The Daily Star Regional Food Archive & Narail Cultural Society",
    citationSources: [
      "The Daily Star: Comforts of Rural Kitchens \u2014 Narail\u2019s Chhit Ruti",
      "Narail District Administration Folk Culture Records",
      "Banglapedia: Riverine Culture and Cuisine of Greater Jashore"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Delicate lacy folded white Chhit Ruti crepes served next to a bowl of rich red Chitol fish curry garnished with green chilies.",
    imageAttribution: "Narail Folk Culinary Heritage Archives"
  },
  chuadanga: {
    districtId: "chuadanga",
    districtNameEn: "Chuadanga",
    districtNameBn: "\u099A\u09C1\u09DF\u09BE\u09A1\u09BE\u0999\u09CD\u0997\u09BE",
    divisionId: "khulna",
    divisionNameEn: "Khulna",
    foodNameEn: "Sarojganj Nolen Gur & Sarbhaja Sweets",
    foodNameBn: "\u09B8\u09B0\u09CB\u099C\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09A8\u09B2\u09C7\u09A8 \u0997\u09C1\u09A1\u09BC \u0993 \u0996\u09BE\u0981\u099F\u09BF \u09B8\u09B0\u09AD\u09BE\u099C\u09BE",
    category: "sweets_pitha",
    dietaryType: "sweet",
    approximatePriceBdt: 360,
    shortDescriptionBn: "\u09E9\u09E6\u09E6 \u09AC\u099B\u09B0\u09C7\u09B0 \u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8 \u09B8\u09B0\u09CB\u099C\u0997\u099E\u09CD\u099C \u09AC\u09BE\u099C\u09BE\u09B0\u09C7\u09B0 \u09B8\u09C1\u09AC\u09BE\u09B8\u09BF\u09A4 \u0996\u09BE\u0981\u099F\u09BF \u09A8\u09B2\u09C7\u09A8 \u0997\u09C1\u09A1\u09BC \u098F\u09AC\u0982 \u0998\u09A8 \u09A6\u09C1\u09A7\u09C7\u09B0 \u09B8\u09B0\u09C7\u09B0 \u09A4\u09C8\u09B0\u09BF \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09B8\u09B0\u09AD\u09BE\u099C\u09BE\u0964",
    shortDescriptionEn: "Renowned artisanal date palm Nolen Gur traded at the 300-year-old Sarojganj market alongside rich fried milk-cream layers (Sarbhaja).",
    detailedDescriptionBn: "\u099A\u09C1\u09AF\u09BC\u09BE\u09A1\u09BE\u0999\u09CD\u0997\u09BE\u09B0 \u09B8\u09B0\u09CB\u099C\u0997\u099E\u09CD\u099C \u09AC\u09BE\u099C\u09BE\u09B0 \u09AA\u09CD\u09B0\u09BE\u09AF\u09BC \u09A4\u09BF\u09A8\u09B6\u09A4 \u09AC\u099B\u09B0\u09C7\u09B0 \u09AA\u09C1\u09B0\u09CB\u09A8\u09CB \u098F\u09AC\u0982 \u098F\u099F\u09BF \u09B8\u09AE\u0997\u09CD\u09B0 \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C7\u09B0 \u09B8\u09B0\u09CD\u09AC\u09AC\u09C3\u09B9\u09CE \u0996\u09C7\u099C\u09C1\u09B0 \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09AE\u09CB\u0995\u09BE\u09AE\u0964 \u09B6\u09C0\u09A4\u0995\u09BE\u09B2\u09C7 \u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8 \u09B6\u09A4 \u09B6\u09A4 \u09AE\u09A3 \u0996\u09BE\u0981\u099F\u09BF \u09A8\u09B2\u09C7\u09A8 \u0997\u09C1\u09A1\u09BC \u098F\u0996\u09BE\u09A8\u09C7 \u09AC\u09C7\u099A\u09BE\u0995\u09C7\u09A8\u09BE \u09B9\u09AF\u09BC\u0964 \u099A\u09C1\u09AF\u09BC\u09BE\u09A1\u09BE\u0999\u09CD\u0997\u09BE\u09B0 \u0997\u09BE\u099B\u09BF\u09A6\u09C7\u09B0 \u09A4\u09C8\u09B0\u09BF \u09A6\u09BE\u09A8\u09BE\u09A6\u09BE\u09B0 \u0997\u09C1\u09A1\u09BC \u098F\u09AC\u0982 \u09A6\u09C1\u09A7\u09C7\u09B0 \u0998\u09A8 \u09B8\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u0998\u09BF\u09AF\u09BC\u09C7 \u09AD\u09C7\u099C\u09C7 \u09A4\u09C8\u09B0\u09BF \u2018\u09B8\u09B0\u09AD\u09BE\u099C\u09BE\u2019 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u098F \u0985\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u098F\u0995 \u0985\u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09CD\u09AC\u09A8\u09CD\u09A6\u09CD\u09AC\u09C0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u0964",
    detailedDescriptionEn: "Chuadanga\u2019s Sarojganj market is nearly 300 years old and stands as Bangladesh\u2019s premier trading epicenter for authentic winter date palm jaggery (Nolen Gur). Sourced directly from local gachhis, the fragrant molasses is paired with Sarbhaja\u2014an artisanal confection crafted from layered milk skin fried in pure desi ghee.",
    ingredients: ["\u0996\u09BE\u0981\u099F\u09BF \u0996\u09C7\u099C\u09C1\u09B0\u09C7\u09B0 \u09A8\u09B2\u09C7\u09A8 \u0997\u09C1\u09A1\u09BC (Fresh Nolen Gur)", "\u09A6\u09C1\u09A7\u09C7\u09B0 \u0998\u09A8 \u09B8\u09B0 (Layered Clotted Milk Skin)", "\u0998\u09BF (Pure Desi Ghee)", "\u099A\u09BF\u09A8\u09BF\u09B0 \u09B8\u09BF\u09B0\u09BE (Sugar Syrup)"],
    preparationMethodEn: "Layers of simmered milk skin are pressed, diced into rectangles, golden-fried in pure desi ghee, and dipped momentarily in fragrant sugar syrup.",
    preparationMethodBn: "\u09A6\u09C1\u09A7 \u099C\u09CD\u09AC\u09BE\u09B2 \u09A6\u09BF\u09DF\u09C7 \u0998\u09A8 \u09B8\u09B0 \u09B8\u09CD\u09A4\u09B0 \u0995\u09B0\u09C7 \u09A4\u09C1\u09B2\u09C7 \u099C\u09AE\u09BF\u09AF\u09BC\u09C7 \u0998\u09BF\u09AF\u09BC\u09C7 \u09B8\u09CB\u09A8\u09BE\u09B2\u09C0 \u0995\u09B0\u09C7 \u09AD\u09C7\u099C\u09C7 \u09B9\u09BE\u09B2\u0995\u09BE \u099A\u09BF\u09A8\u09BF\u09B0 \u09B8\u09BF\u09B0\u09BE\u09AF\u09BC \u09A1\u09C1\u09AC\u09BF\u09AF\u09BC\u09C7 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09B8\u09B0\u09AD\u09BE\u099C\u09BE \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented in national economic and culinary surveys as the historical date-palm heartland of Western Bangladesh.",
    historicalContextBn: "\u09B8\u09B0\u09CB\u099C\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u09A4\u09BF\u09A8\u09B6\u09A4 \u09AC\u099B\u09B0\u09C7\u09B0 \u09AA\u09C1\u09B0\u09CB\u09A8\u09CB \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0996\u09C7\u099C\u09C1\u09B0\u09C7\u09B0 \u0997\u09C1\u09A1\u09BC\u09C7\u09B0 \u09B9\u09BE\u099F \u09B8\u09AE\u0997\u09CD\u09B0 \u09A6\u09C7\u09B6\u09C7 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u0993 \u09B8\u09B0\u0995\u09BE\u09B0 \u0995\u09B0\u09CD\u09A4\u09C3\u0995 \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09BF\u09A4 \u09B2\u09CB\u0995-\u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u0964",
    primarySource: "The Daily Star & Chuadanga District Administration Agrarian Records",
    citationSources: [
      "The Daily Star: The 300-year-old date molasses market of Sarojganj",
      "Chuadanga District Administration Official Profile",
      "Bangladesh Small and Cottage Industries Corporation (BSCIC) Artisan Dairy Documentation"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Golden crisp-edged layers of milk-cream Sarbhaja pastry alongside an earthen jug pouring rich dark Nolen Gur.",
    imageAttribution: "Chuadanga Regional Agrarian Heritage Collection"
  },
  jhalokati: {
    districtId: "jhalokati",
    districtNameEn: "Jhalokati",
    districtNameBn: "\u099D\u09BE\u09B2\u0995\u09BE\u09A0\u09BF",
    divisionId: "barishal",
    divisionNameEn: "Barishal",
    foodNameEn: "Bhimruli Peyara (Floating Market Guava) & Chhana Sweets",
    foodNameBn: "\u09AD\u09C0\u09AE\u09B0\u09C1\u09B2\u09BF\u09B0 \u09AD\u09BE\u09B8\u09AE\u09BE\u09A8 \u09AC\u09BE\u099C\u09BE\u09B0\u09C7\u09B0 \u09AA\u09C7\u09AF\u09BC\u09BE\u09B0\u09BE \u0993 \u0996\u09BE\u0981\u099F\u09BF \u099B\u09BE\u09A8\u09BE\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    category: "snacks",
    dietaryType: "sweet",
    approximatePriceBdt: 120,
    shortDescriptionBn: "\u09A6\u0995\u09CD\u09B7\u09BF\u09A3\u09AC\u0999\u09CD\u0997\u09C7\u09B0 \u09AD\u09C7\u09A8\u09BF\u09B8\u0996\u09CD\u09AF\u09BE\u09A4 \u09AD\u09C0\u09AE\u09B0\u09C1\u09B2\u09BF\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AD\u09BE\u09B8\u09AE\u09BE\u09A8 \u09AC\u09BE\u099C\u09BE\u09B0\u09C7\u09B0 \u09B8\u09C1\u09AE\u09BF\u09B7\u09CD\u099F \u09A4\u09BE\u099C\u09BE \u09AA\u09C7\u09AF\u09BC\u09BE\u09B0\u09BE \u098F\u09AC\u0982 \u099D\u09BE\u09B2\u0995\u09BE\u09A0\u09BF\u09B0 \u09B8\u09CD\u09A5\u09BE\u09A8\u09C0\u09AF\u09BC \u099B\u09BE\u09A8\u09BE\u09B0 \u09B0\u09B8\u0997\u09CB\u09B2\u09CD\u09B2\u09BE\u0964",
    shortDescriptionEn: "Crisp sweet guavas harvested from the historic floating canal markets of Bhimruli paired with traditional cottage cheese sweets.",
    detailedDescriptionBn: "\u099D\u09BE\u09B2\u0995\u09BE\u09A0\u09BF\u09B0 \u09AD\u09C0\u09AE\u09B0\u09C1\u09B2\u09BF\u09B0 \u0996\u09BE\u09B2\u09C7\u09B0 \u09AE\u09CB\u09B9\u09A8\u09BE\u09AF\u09BC \u0985\u09A8\u09C1\u09B7\u09CD\u09A0\u09BF\u09A4 \u09B9\u09AF\u09BC \u098F\u09B6\u09BF\u09AF\u09BC\u09BE\u09B0 \u09B8\u09B0\u09CD\u09AC\u09AC\u09C3\u09B9\u09CE \u09AD\u09BE\u09B8\u09AE\u09BE\u09A8 \u09AA\u09C7\u09AF\u09BC\u09BE\u09B0\u09BE \u09AC\u09BE\u099C\u09BE\u09B0\u0964 \u09E8\u09E6\u09E6 \u09AC\u099B\u09B0\u09C7\u09B0\u0993 \u09AC\u09C7\u09B6\u09BF \u09B8\u09AE\u09AF\u09BC \u09A7\u09B0\u09C7 \u09A8\u09CC\u0995\u09BE\u09AF\u09BC \u09A8\u09CC\u0995\u09BE\u09AF\u09BC \u09AC\u09C7\u099A\u09BE\u0995\u09C7\u09A8\u09BE \u09B9\u09AF\u09BC \u098F\u0996\u09BE\u09A8\u0995\u09BE\u09B0 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u099C\u09BE\u09A4\u09C7\u09B0 \u09AA\u09C7\u09AF\u09BC\u09BE\u09B0\u09BE\u0964 \u098F\u0987 \u09B8\u09C1\u09AE\u09BF\u09B7\u09CD\u099F \u0993 \u0995\u099A\u0995\u099A\u09C7 \u09AA\u09C7\u09AF\u09BC\u09BE\u09B0\u09BE\u09B0 \u09AA\u09BE\u09B6\u09BE\u09AA\u09BE\u09B6\u09BF \u099D\u09BE\u09B2\u0995\u09BE\u09A0\u09BF \u09B6\u09B9\u09B0\u09C7\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF\u09AA\u099F\u09CD\u099F\u09BF\u09B0 \u09A4\u09BE\u099C\u09BE \u0996\u09BE\u0981\u099F\u09BF \u099B\u09BE\u09A8\u09BE\u09B0 \u09B0\u09B8\u0997\u09CB\u09B2\u09CD\u09B2\u09BE \u0993 \u099A\u09AE\u099A\u09AE \u09A6\u0995\u09CD\u09B7\u09BF\u09A3\u09BE\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u09B0\u09A8\u09CD\u09A7\u09A8\u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09C7\u09B0 \u0985\u09A8\u09CD\u09AF\u09A4\u09AE \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0\u0964",
    detailedDescriptionEn: "Bhimruli in Jhalokati is home to Bangladesh\u2019s iconic floating guava market, where wooden canoes laden with fresh, crisp green-yellow guavas assemble along intersecting canals. Cultivated over 31,000 acres of tidal orchards, these aromatic guavas are celebrated alongside Jhalokati town\u2019s heritage fresh-chhana sweets.",
    ingredients: ["\u09AD\u09C0\u09AE\u09B0\u09C1\u09B2\u09BF\u09B0 \u09A4\u09BE\u099C\u09BE \u09AA\u09C7\u09AF\u09BC\u09BE\u09B0\u09BE (Bhimruli Fresh Guava)", "\u0996\u09BE\u0981\u099F\u09BF \u099B\u09BE\u09A8\u09BE (Fresh Chhana)", "\u099A\u09BF\u09A8\u09BF\u09B0 \u09B8\u09BF\u09B0\u09BE (Sugar Syrup)"],
    preparationMethodEn: "Guavas are hand-plucked at dawn and transported by wooden dinghy to the water market; served fresh with rock salt and chili powder, or accompanied by fresh sweets.",
    preparationMethodBn: "\u09AD\u09CB\u09B0\u09C7\u09B0 \u09A4\u09BE\u099C\u09BE \u09AA\u09C7\u09AF\u09BC\u09BE\u09B0\u09BE \u09AC\u09BE\u0997\u09BE\u09A8 \u09A5\u09C7\u0995\u09C7 \u09A4\u09C1\u09B2\u09C7 \u09A1\u09BF\u0999\u09CD\u0997\u09BF \u09A8\u09CC\u0995\u09BE\u09AF\u09BC \u0995\u09B0\u09C7 \u09AC\u09BE\u099C\u09BE\u09B0\u09C7 \u098F\u09A8\u09C7 \u09AA\u09B0\u09BF\u09AC\u09C7\u09B6\u09A8 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC \u09AC\u09BF\u099F \u09B2\u09AC\u09A3 \u0993 \u0997\u09C1\u0981\u09A1\u09BC\u09CB \u09AE\u09B0\u09BF\u099A\u09C7 \u09AE\u09C7\u0996\u09C7\u0964",
    historicalContextEn: "Documented in national tourism archives and international travel journalism as a unique 200-year-old riverine agricultural market system.",
    historicalContextBn: "\u099D\u09BE\u09B2\u0995\u09BE\u09A0\u09BF\u09B0 \u0995\u09C0\u09B0\u09CD\u09A4\u09BF\u09AA\u09BE\u09B6\u09BE \u0993 \u09AD\u09C0\u09AE\u09B0\u09C1\u09B2\u09BF\u09B0 \u09AD\u09BE\u09B8\u09AE\u09BE\u09A8 \u09B9\u09BE\u099F \u09A6\u0995\u09CD\u09B7\u09BF\u09A3\u09BE\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u09A8\u09A6\u09C0\u09AE\u09BE\u09A4\u09C3\u0995 \u099C\u09C0\u09AC\u09A8 \u0993 \u09B2\u09CB\u0995\u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09C7\u09B0 \u09AA\u09CD\u09B0\u09A4\u09C0\u0995\u0964",
    primarySource: "Bangladesh Tourism Board & Jhalokati District Administration",
    citationSources: [
      "Bangladesh Sangbad Sangstha (BSS): The Vibrant Floating Guava Market of Bhimruli",
      "Jhalokati District Administration Tourism & Heritage Documentation",
      "The Daily Star: Navigating the Southern Waterways of Jhalokati"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Wooden dinghy boat filled to the brim with pale green guavas floating on calm canal waters beside a local dessert platter.",
    imageAttribution: "Bangladesh Tourism Board / Cultural Heritage Society"
  },
  pirojpur: {
    districtId: "pirojpur",
    districtNameEn: "Pirojpur",
    districtNameBn: "\u09AA\u09BF\u09B0\u09CB\u099C\u09AA\u09C1\u09B0",
    divisionId: "barishal",
    divisionNameEn: "Barishal",
    foodNameEn: "Pirojpur Amra Morobba & Dulal Dodhi Bhandar Rasgulla",
    foodNameBn: "\u09AA\u09BF\u09B0\u09CB\u099C\u09AA\u09C1\u09B0\u09C7\u09B0 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u0986\u09AE\u09A1\u09BC\u09BE \u09AE\u09CB\u09B0\u09AC\u09CD\u09AC\u09BE \u0993 \u09A6\u09C1\u09B2\u09BE\u09B2 \u09A6\u09A7\u09BF \u09AD\u09BE\u09A3\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u09B0\u09B8\u0997\u09CB\u09B2\u09CD\u09B2\u09BE",
    category: "sweets_pitha",
    dietaryType: "sweet",
    approximatePriceBdt: 180,
    shortDescriptionBn: "\u09A6\u0995\u09CD\u09B7\u09BF\u09A3\u09BE\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u09B0\u09B8\u09BE\u09B2\u09CB \u0986\u09AE\u09A1\u09BC\u09BE\u09B0 \u09A4\u09C8\u09B0\u09BF \u099F\u0995-\u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09AE\u09CB\u09B0\u09AC\u09CD\u09AC\u09BE \u098F\u09AC\u0982 \u09B6\u09B9\u09B0\u09C7\u09B0 \u09A6\u09C1\u09B2\u09BE\u09B2 \u09A6\u09A7\u09BF \u09AD\u09BE\u09A3\u09CD\u09A1\u09BE\u09B0\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0997\u09B0\u09AE \u09B0\u09B8\u0997\u09CB\u09B2\u09CD\u09B2\u09BE \u0993 \u09B2\u09CD\u09AF\u09BE\u0982\u099A\u09BE\u0964",
    shortDescriptionEn: "Sweet-and-tangy candied preserves made from indigenous hog plums (Amra) alongside warm fresh Rasgullas from Dulal Dodhi Bhandar.",
    detailedDescriptionBn: "\u09AA\u09BF\u09B0\u09CB\u099C\u09AA\u09C1\u09B0 \u099C\u09C7\u09B2\u09BE \u09A6\u09C7\u09B6\u09C7\u09B0 \u09B8\u09B0\u09CD\u09AC\u09AC\u09C3\u09B9\u09CE \u0986\u09AE\u09A1\u09BC\u09BE \u0989\u09CE\u09AA\u09BE\u09A6\u09A8\u0995\u09BE\u09B0\u09C0 \u0985\u099E\u09CD\u099A\u09B2 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09B8\u09C1\u09AA\u09B0\u09BF\u099A\u09BF\u09A4\u0964 \u098F\u0996\u09BE\u09A8\u0995\u09BE\u09B0 \u09AC\u09A1\u09BC \u0993 \u09B0\u09B8\u09BE\u09B2\u09CB \u09A6\u09C7\u09B6\u09BF \u0986\u09AE\u09A1\u09BC\u09BE \u09A6\u09BF\u09AF\u09BC\u09C7 \u09A4\u09C8\u09B0\u09BF \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09AE\u09CB\u09B0\u09AC\u09CD\u09AC\u09BE \u0993 \u0986\u099A\u09BE\u09B0 \u09A6\u09C0\u09B0\u09CD\u0998\u0995\u09BE\u09B2 \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u0995\u09B0\u09C7 \u0996\u09BE\u0993\u09AF\u09BC\u09BE \u09B9\u09AF\u09BC\u0964 \u098F\u099B\u09BE\u09A1\u09BC\u09BE \u09AA\u09BF\u09B0\u09CB\u099C\u09AA\u09C1\u09B0 \u09B8\u09A6\u09B0\u09C7\u09B0 \u09A6\u09C1\u09B2\u09BE\u09B2 \u09A6\u09A7\u09BF \u09AD\u09BE\u09A3\u09CD\u09A1\u09BE\u09B0 \u0993 \u09B8\u09BE\u09A7\u09C1\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF\u09B0 \u09A6\u09CB\u0995\u09BE\u09A8\u09C7\u09B0 \u0997\u09B0\u09AE \u09B0\u09B8\u0997\u09CB\u09B2\u09CD\u09B2\u09BE \u0993 \u09B2\u09CD\u09AF\u09BE\u0982\u099A\u09BE \u09AA\u09CD\u09B0\u09BE\u09AF\u09BC \u0985\u09B0\u09CD\u09A7\u09B6\u09A4\u09BE\u09AC\u09CD\u09A6\u09C0 \u09A7\u09B0\u09C7 \u09A6\u0995\u09CD\u09B7\u09BF\u09A3\u09BE\u099E\u09CD\u099A\u09B2\u09C7 \u0996\u09CD\u09AF\u09BE\u09A4\u09BF \u09A7\u09B0\u09C7 \u09B0\u09C7\u0996\u09C7\u099B\u09C7\u0964",
    detailedDescriptionEn: "Pirojpur produces the finest hog plums (Amra) in Bangladesh. Local culinary traditions turn these tart fruits into translucent, spiced sweet preserves (morobba) cooked in thickened sugar syrup with cloves and cinnamon. Pirojpur town is equally famed for Dulal Dodhi Bhandar\u2019s piping hot Rasgullas and Langchas.",
    ingredients: ["\u09A4\u09BE\u099C\u09BE \u09A6\u09C7\u09B6\u09BF \u0986\u09AE\u09A1\u09BC\u09BE (Fresh Hog Plum / Amra)", "\u099A\u09BF\u09A8\u09BF\u09B0 \u0997\u09BE\u09A2\u09BC \u09B8\u09BF\u09B0\u09BE (Concentrated Sugar Syrup)", "\u09A6\u09BE\u09B0\u09C1\u099A\u09BF\u09A8\u09BF \u0993 \u09B2\u09AC\u0999\u09CD\u0997 (Cinnamon & Cloves)", "\u0996\u09BE\u0981\u099F\u09BF \u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7\u09C7\u09B0 \u099B\u09BE\u09A8\u09BE (Cow Milk Chhana for Rasgulla)"],
    preparationMethodEn: "Peeled hog plums are pricked with forks, soaked in lime water, rinsed, and slowly simmered in spiced sugar syrup until candied and translucent.",
    preparationMethodBn: "\u0986\u09AE\u09A1\u09BC\u09BE\u09B0 \u0996\u09CB\u09B8\u09BE \u099B\u09BE\u09A1\u09BC\u09BF\u09AF\u09BC\u09C7 \u0995\u09BE\u0981\u099F\u09BE\u099A\u09BE\u09AE\u099A \u09A6\u09BF\u09AF\u09BC\u09C7 \u0995\u09C7\u099A\u09C7 \u099A\u09C1\u09A8\u09AA\u09BE\u09A8\u09BF\u09A4\u09C7 \u09AD\u09BF\u099C\u09BF\u09AF\u09BC\u09C7 \u09AA\u09B0\u09BF\u09B7\u09CD\u0995\u09BE\u09B0 \u0995\u09B0\u09C7 \u098F\u09B2\u09BE\u099A-\u09A6\u09BE\u09B0\u09C1\u099A\u09BF\u09A8\u09BF\u09B0 \u09B8\u09BF\u09B0\u09BE\u09AF\u09BC \u09A6\u09C0\u09B0\u09CD\u0998\u0995\u09CD\u09B7\u09A3 \u09AB\u09C1\u099F\u09BF\u09AF\u09BC\u09C7 \u09AE\u09CB\u09B0\u09AC\u09CD\u09AC\u09BE \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented in regional horticulture archives and local culinary journalism as Pirojpur\u2019s defining indigenous agro-confection.",
    historicalContextBn: "\u09AA\u09BF\u09B0\u09CB\u099C\u09AA\u09C1\u09B0\u09C7\u09B0 \u09A8\u09A6\u09C0\u09AE\u09BE\u09A4\u09C3\u0995 \u0989\u09B0\u09CD\u09AC\u09B0 \u09AE\u09BE\u099F\u09BF\u09B0 \u0986\u09AE\u09A1\u09BC\u09BE \u0993 \u09B8\u09CD\u09A5\u09BE\u09A8\u09C0\u09AF\u09BC \u09AE\u09AF\u09BC\u09B0\u09BE\u09A6\u09C7\u09B0 \u09B6\u09A4\u09AC\u09B0\u09CD\u09B7\u09C0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8 \u09B8\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF \u09A6\u0995\u09CD\u09B7\u09BF\u09A3\u09BE\u099E\u09CD\u099A\u09B2\u09C7 \u09B8\u09AE\u09BE\u09A6\u09C3\u09A4\u0964",
    primarySource: "Pirojpur District Administration & Department of Agricultural Extension (DAE)",
    citationSources: [
      "Pirojpur District Administration Cultural Section",
      "DAE Horticulture Profile: Hog Plum Cultivation in Pirojpur",
      "The Daily Star: Southern Delights of Pirojpur"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Glazed golden-amber candied hog plum morobba in syrup served next to spongy white Rasgulla in an antique porcelain bowl.",
    imageAttribution: "Pirojpur Regional Food Archive"
  },
  barguna: {
    districtId: "barguna",
    districtNameEn: "Barguna",
    districtNameBn: "\u09AC\u09B0\u0997\u09C1\u09A8\u09BE",
    divisionId: "barishal",
    divisionNameEn: "Barishal",
    foodNameEn: "Payra River Pangas & Chui Jhal Macher Jhol",
    foodNameBn: "\u09AA\u09BE\u09AF\u09BC\u09B0\u09BE \u09A8\u09A6\u09C0\u09B0 \u09A4\u09BE\u099C\u09BE \u09AA\u09BE\u0999\u09CD\u0997\u09BE\u09B6 \u0993 \u099A\u09C1\u0987\u099D\u09BE\u09B2 \u09A6\u09BF\u09AF\u09BC\u09C7 \u09AE\u09BE\u099B\u09C7\u09B0 \u099D\u09CB\u09B2",
    category: "main_course",
    dietaryType: "non-veg",
    approximatePriceBdt: 240,
    shortDescriptionBn: "\u0989\u09AA\u0995\u09C2\u09B2\u09C0\u09AF\u09BC \u09AA\u09BE\u09AF\u09BC\u09B0\u09BE \u0993 \u09AC\u09BF\u09B7\u0996\u09BE\u09B2\u09C0 \u09A8\u09A6\u09C0\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09AA\u09BE\u09A8\u09BF\u09B0 \u09A4\u09BE\u099C\u09BE \u09AE\u09BE\u099B \u09A6\u09BF\u09AF\u09BC\u09C7 \u09A6\u0995\u09CD\u09B7\u09BF\u09A3\u09AC\u0999\u09CD\u0997\u09C7\u09B0 \u09AD\u09C7\u09B7\u099C \u0995\u09BE\u09A3\u09CD\u09A1 \u099A\u09C1\u0987\u099D\u09BE\u09B2\u09C7\u09B0 \u09A4\u09C0\u09AC\u09CD\u09B0 \u09B8\u09C1\u09AC\u09BE\u09B8\u09BF\u09A4 \u0995\u09B7\u09BE \u09A4\u09B0\u0995\u09BE\u09B0\u09BF\u0964",
    shortDescriptionEn: "Fresh wild river fish caught from the Payra and Bishkhali estuaries braved with aromatic, peppery Chui Jhal root stems.",
    detailedDescriptionBn: "\u09AC\u09B0\u0997\u09C1\u09A8\u09BE \u099C\u09C7\u09B2\u09BE\u09B0 \u0993\u09AA\u09B0 \u09A6\u09BF\u09AF\u09BC\u09C7 \u09AA\u09CD\u09B0\u09AC\u09BE\u09B9\u09BF\u09A4 \u09AA\u09BE\u09AF\u09BC\u09B0\u09BE \u0993 \u09AC\u09BF\u09B7\u0996\u09BE\u09B2\u09C0 \u09A8\u09A6\u09C0\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09AA\u09BE\u09A8\u09BF\u09B0 \u09A4\u09BE\u099C\u09BE \u09AA\u09BE\u0999\u09CD\u0997\u09BE\u09B6 \u0993 \u09A8\u09A6\u09C0\u09B0 \u09AE\u09BE\u099B \u09B8\u09CD\u09AC\u09BE\u09A6\u09C7 \u0985\u09B8\u09BE\u09A7\u09BE\u09B0\u09A3\u0964 \u09A6\u0995\u09CD\u09B7\u09BF\u09A3\u09BE\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AE\u09B6\u09B2\u09BE \u2018\u099A\u09C1\u0987\u099D\u09BE\u09B2\u2019 (Piper chaba)-\u098F\u09B0 \u0995\u09BE\u09A3\u09CD\u09A1 \u099B\u09CB\u099F \u099B\u09CB\u099F \u099F\u09C1\u0995\u09B0\u09CB \u0995\u09B0\u09C7 \u098F\u0987 \u09AE\u09BE\u099B\u09C7\u09B0 \u09A4\u09B0\u0995\u09BE\u09B0\u09BF\u09A4\u09C7 \u09A6\u09C7\u0993\u09AF\u09BC\u09BE \u09B9\u09AF\u09BC\u0964 \u099A\u09C1\u0987\u099D\u09BE\u09B2\u09C7\u09B0 \u09A4\u09C0\u09AC\u09CD\u09B0 \u099D\u09BE\u0981\u099C\u09BE\u09B2\u09CB \u0993 \u09AD\u09C7\u09B7\u099C \u09B8\u09C1\u09AC\u09BE\u09B8 \u09AE\u09BE\u099B\u09C7\u09B0 \u099D\u09CB\u09B2\u0995\u09C7 \u09A6\u09C7\u09AF\u09BC \u0985\u09A4\u09C1\u09B2\u09A8\u09C0\u09AF\u09BC \u09B8\u09CD\u09AC\u09BE\u09A6 \u0993 \u0994\u09B7\u09A7\u09BF \u0997\u09C1\u09A3\u0964",
    detailedDescriptionEn: "Barguna is bordered by the pristine Payra and Bishkhali rivers, renowned for their naturally sweet, non-farmed wild river fish. Local cooks stew thick steaks with Chui Jhal (Piper chaba) wood stems, whose intense, pungent heat and woody aroma infuse the gravy, creating a hallmark coastal culinary staple.",
    ingredients: ["\u09AA\u09BE\u09AF\u09BC\u09B0\u09BE \u09A8\u09A6\u09C0\u09B0 \u09A4\u09BE\u099C\u09BE \u09AE\u09BE\u099B (Fresh Wild Payra River Fish)", "\u099A\u09C1\u0987\u099D\u09BE\u09B2\u09C7\u09B0 \u0995\u09BE\u09A3\u09CD\u09A1 (Chui Jhal / Piper chaba stems)", "\u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2 (Mustard Oil)", "\u09B0\u09B8\u09C1\u09A8 \u0993 \u0986\u09A6\u09BE \u09AC\u09BE\u099F\u09BE (Garlic & Ginger Paste)", "\u099C\u09BF\u09B0\u09BE \u0993 \u09B9\u09B2\u09C1\u09A6 \u0997\u09C1\u0981\u09A1\u09BC\u09CB (Cumin & Turmeric)"],
    preparationMethodEn: "Fish steaks are seasoned and lightly seared, while Chui Jhal stems are saut\xE9ed with crushed garlic and spices, then simmered together into a fiery, fragrant gravy.",
    preparationMethodBn: "\u09AE\u09BE\u099B\u09C7\u09B0 \u099F\u09C1\u0995\u09B0\u09CB \u09B9\u09B2\u09C1\u09A6-\u09B2\u09AC\u09A3\u09C7 \u09B9\u09BE\u09B2\u0995\u09BE \u09AD\u09C7\u099C\u09C7 \u099A\u09C1\u0987\u099D\u09BE\u09B2\u09C7\u09B0 \u0995\u09BE\u09A3\u09CD\u09A1 \u0993 \u09B0\u09B8\u09C1\u09A8-\u09AA\u09C7\u0981\u09AF\u09BC\u09BE\u099C\u09C7\u09B0 \u0995\u09B7\u09BE\u09A8\u09CB \u099D\u09CB\u09B2\u09C7 \u09AB\u09C1\u099F\u09BF\u09AF\u09BC\u09C7 \u0998\u09A8 \u099D\u09CB\u09B2 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented in coastal fishery surveys and southwestern folklore studies as an authentic riverine culinary staple.",
    historicalContextBn: "\u09AC\u09B0\u0997\u09C1\u09A8\u09BE\u09B0 \u099C\u09C7\u09B2\u09C7 \u099C\u09A8\u09AA\u09A6 \u0993 \u0989\u09AA\u0995\u09C2\u09B2\u09C0\u09AF\u09BC \u09B0\u09A8\u09CD\u09A7\u09A8\u09B8\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF\u09A4\u09C7 \u099A\u09C1\u0987\u099D\u09BE\u09B2\u09C7\u09B0 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u09B6\u09A4\u09BE\u09AC\u09CD\u09A6\u09C0\u09B0 \u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u0964",
    primarySource: "Barguna District Administration & Coastal Fisheries Research Study",
    citationSources: [
      "Barguna District Administration Heritage Records",
      "Prothom Alo Feature: The culinary charm of Chui Jhal in coastal kitchens",
      "The Financial Express: Wild river fish culture of the southern coast"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Steaming coastal fish curry with visible cylindrical pieces of Chui Jhal stem in a rich, dark-amber gravy on brass tableware.",
    imageAttribution: "Coastal Bengal Folk Culture Institute"
  },
  habiganj: {
    districtId: "habiganj",
    districtNameEn: "Habiganj",
    districtNameBn: "\u09B9\u09AC\u09BF\u0997\u099E\u09CD\u099C",
    divisionId: "sylhet",
    divisionNameEn: "Sylhet",
    foodNameEn: "Haor Hasher Mangsho (Wetland Duck Curry) & Khasia Paan",
    foodNameBn: "\u09B9\u09AC\u09BF\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u09B9\u09BE\u0993\u09B0\u09C7\u09B0 \u09B9\u09BE\u0981\u09B8\u09C7\u09B0 \u09AE\u09BE\u0982\u09B8\u09C7\u09B0 \u09AD\u09C1\u09A8\u09BE \u0993 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0996\u09BE\u09B8\u09BF\u09AF\u09BC\u09BE \u09AA\u09BE\u09A8",
    category: "main_course",
    dietaryType: "non-veg",
    approximatePriceBdt: 290,
    shortDescriptionBn: "\u09B9\u09AC\u09BF\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u09B9\u09BE\u0993\u09B0\u09BE\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995 \u09B6\u09BE\u09AE\u09C1\u0995 \u0996\u09BE\u0993\u09AF\u09BC\u09BE \u09B9\u09BE\u0981\u09B8\u09C7\u09B0 \u0997\u09BE\u09A2\u09BC \u09A4\u09C7\u09B2-\u09AE\u09B6\u09B2\u09BE\u09AF\u09BC \u0995\u09B7\u09BE \u09AE\u09BE\u0982\u09B8 \u098F\u09AC\u0982 \u09B8\u09C0\u09AE\u09BE\u09A8\u09CD\u09A4 \u0985\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u09B8\u09C1\u0997\u09A8\u09CD\u09A7\u09BF \u0996\u09BE\u09B8\u09BF\u09AF\u09BC\u09BE \u09AA\u09BE\u09A8\u0964",
    shortDescriptionEn: "Rich, slow-cooked haor wetland duck curry stewed in aromatic spices, concluded with crisp, pungent indigenous Khasia betel leaf.",
    detailedDescriptionBn: "\u09B9\u09AC\u09BF\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u09AC\u09BF\u09B8\u09CD\u09A4\u09C0\u09B0\u09CD\u09A3 \u09B9\u09BE\u0993\u09B0 \u0985\u099E\u09CD\u099A\u09B2\u09C7 \u09AE\u09C1\u0995\u09CD\u09A4 \u099C\u09B2\u09BE\u09B6\u09AF\u09BC\u09C7 \u09B6\u09BE\u09AE\u09C1\u0995 \u0993 \u099B\u09CB\u099F \u09AE\u09BE\u099B \u0996\u09C7\u09AF\u09BC\u09C7 \u09AC\u09A1\u09BC \u09B9\u0993\u09AF\u09BC\u09BE \u09A6\u09C7\u09B6\u09BF \u09B9\u09BE\u0981\u09B8\u09C7\u09B0 \u09AE\u09BE\u0982\u09B8 \u09B8\u09CD\u09AC\u09BE\u09A6\u09C7 \u0985\u09A4\u09CD\u09AF\u09A8\u09CD\u09A4 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u0993 \u0998\u09A8\u0964 \u09B6\u09C0\u09A4\u0995\u09BE\u09B2\u09C7 \u09A8\u09A4\u09C1\u09A8 \u09B0\u09B8\u09C1\u09A8, \u0986\u09A6\u09BE \u0993 \u0997\u09B0\u09AE \u09AE\u09B6\u09B2\u09BE \u09A6\u09BF\u09AF\u09BC\u09C7 \u0995\u09A1\u09BC\u09BE \u09AD\u09C1\u09A8\u09BE \u0995\u09B0\u09BE \u09B9\u09BE\u0981\u09B8\u09C7\u09B0 \u09AE\u09BE\u0982\u09B8 \u09AD\u09C1\u09A8\u09BE \u0996\u09BF\u099A\u09C1\u09A1\u09BC\u09BF \u09AC\u09BE \u099A\u09BE\u09B2\u09C7\u09B0 \u0986\u099F\u09BE\u09B0 \u09B0\u09C1\u099F\u09BF\u09B0 \u09B8\u09BE\u09A5\u09C7 \u0985\u09A4\u09C1\u09B2\u09A8\u09C0\u09AF\u09BC\u0964 \u0986\u09B9\u09BE\u09B0\u09C7\u09B0 \u09B6\u09C7\u09B7\u09C7 \u099A\u09C1\u09A8-\u09B8\u09C1\u09AA\u09BE\u09B0\u09BF \u09B8\u09B9\u09AF\u09CB\u0997\u09C7 \u09AA\u09B0\u09BF\u09AC\u09C7\u09B6\u09A8 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC \u09B8\u09C0\u09AE\u09BE\u09A8\u09CD\u09A4\u09AC\u09B0\u09CD\u09A4\u09C0 \u0985\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u099C\u09BF\u0986\u0987-\u09AE\u09B0\u09CD\u09AF\u09BE\u09A6\u09BE\u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u09B8\u09C1\u0997\u09A8\u09CD\u09A7\u09BF \u0996\u09BE\u09B8\u09BF\u09AF\u09BC\u09BE \u09AA\u09BE\u09A8\u0964",
    detailedDescriptionEn: "The expansive wetlands of Habiganj produce free-range ducks nurtured on freshwater snails and water-weeds, yielding exceptionally tender, flavorful dark meat. Simmered slowly with mustard oil, crushed whole garlic bulbs, and Sylheti garam masala, it is traditionally finished with the crisp, medicinal Khasia betel leaf cultivated by the Khasi indigenous community.",
    ingredients: ["\u09B9\u09BE\u0993\u09B0\u09C7\u09B0 \u09A6\u09C7\u09B6\u09BF \u09B9\u09BE\u0981\u09B8 (Free-Range Wetland Duck)", "\u09B0\u09B8\u09C1\u09A8 \u0993 \u0986\u09A6\u09BE \u09AC\u09BE\u099F\u09BE (Crushed Garlic & Ginger Paste)", "\u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2 (Mustard Oil)", "\u09B8\u09BF\u09B2\u09C7\u099F\u09BF \u0997\u09B0\u09AE \u09AE\u09B6\u09B2\u09BE (Sylheti Garam Masala)", "\u0996\u09BE\u09B8\u09BF\u09AF\u09BC\u09BE \u09AA\u09BE\u09A8 (Fresh Khasia Betel Leaves)"],
    preparationMethodEn: "Duck meat is browned in smoking mustard oil with whole bay leaves and black cardamoms, then braised with a thick onion-garlic paste until rich and dark.",
    preparationMethodBn: "\u09B9\u09BE\u0981\u09B8\u09C7\u09B0 \u09AE\u09BE\u0982\u09B8 \u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2\u09C7 \u09A4\u09C7\u099C\u09AA\u09BE\u09A4\u09BE \u0993 \u098F\u09B2\u09BE\u099A\u09C7 \u0995\u09A1\u09BC\u09BE \u0995\u09B0\u09C7 \u0995\u09B7\u09BF\u09AF\u09BC\u09C7 \u0986\u09A6\u09BE-\u09B0\u09B8\u09C1\u09A8\u09C7\u09B0 \u09AA\u09C7\u09B8\u09CD\u099F\u09C7 \u09A6\u09C0\u09B0\u09CD\u0998\u0995\u09CD\u09B7\u09A3 \u09A7\u09BF\u09AE\u09C7 \u0986\u0981\u099A\u09C7 \u09B0\u09BE\u09A8\u09CD\u09A8\u09BE \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented in Sylhet regional folklore and botanical anthropological studies on Khasi border communities.",
    historicalContextBn: "\u09B9\u09AC\u09BF\u0997\u099E\u09CD\u099C\u09C7\u09B0 \u09B9\u09BE\u0993\u09B0 \u09B8\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF \u0993 \u0996\u09BE\u09B8\u09BF\u09AF\u09BC\u09BE \u09AA\u09C1\u099E\u09CD\u099C\u09BF\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u099C\u09C0\u09AC\u09A8\u09A7\u09BE\u09B0\u09BE\u09AF\u09BC \u09B9\u09BE\u0981\u09B8\u09C7\u09B0 \u09AE\u09BE\u0982\u09B8 \u0993 \u0996\u09BE\u09B8\u09BF\u09AF\u09BC\u09BE \u09AA\u09BE\u09A8\u09C7\u09B0 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u09B6\u09A4\u09BE\u09AC\u09CD\u09A6\u09C0\u09B0 \u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8\u0964",
    primarySource: "Habiganj District Administration & Sylhet Division Folk Heritage Register",
    citationSources: [
      "The Daily Star: Culinary Wonders of the Haor Basin",
      "ResearchGate: Ethnobotanical and Cultural Studies on Khasia Paan in Habiganj",
      "Habiganj District Portal (Cultural Division)"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Dark, glistening duck curry with rich spiced gravy served in a clay handi beside fresh emerald-green Khasia betel leaves.",
    imageAttribution: "Sylhet Folk Heritage Society"
  },
  panchagarh: {
    districtId: "panchagarh",
    districtNameEn: "Panchagarh",
    districtNameBn: "\u09AA\u099E\u09CD\u099A\u0997\u09DC",
    divisionId: "rangpur",
    divisionNameEn: "Rangpur",
    foodNameEn: "Panchagarh Pelka & Chhyaka (Indigenous Green Soup)",
    foodNameBn: "\u09AA\u099E\u09CD\u099A\u0997\u09A1\u09BC\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AA\u09C7\u09B2\u0995\u09BE \u0993 \u0995\u09CD\u09B7\u09BE\u09B0 \u09A6\u09BF\u09AF\u09BC\u09C7 \u09B0\u09BE\u09A8\u09CD\u09A8\u09BE \u099B\u09CD\u09AF\u09BE\u0995\u09BE",
    category: "traditional",
    dietaryType: "veg",
    approximatePriceBdt: 110,
    shortDescriptionBn: "\u0989\u09A4\u09CD\u09A4\u09B0\u09AC\u0999\u09CD\u0997\u09C7\u09B0 \u09B9\u09BF\u09AE\u09BE\u09B2\u09AF\u09BC \u09AA\u09BE\u09A6\u09A6\u09C7\u09B6\u09C0\u09AF\u09BC \u0985\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u09A8\u09BE\u09AA\u09BE \u09B6\u09BE\u0995 \u0993 \u09A1\u09BE\u0981\u099F\u09BE \u09A6\u09BF\u09AF\u09BC\u09C7 \u09B8\u09CB\u09A1\u09BE \u09AC\u09BE \u0995\u09CD\u09B7\u09BE\u09B0\u09C7 \u09B8\u09C7\u09A6\u09CD\u09A7 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09AD\u09C7\u09B7\u099C \u09B8\u09CD\u09AF\u09C1\u09AA \u09AA\u09C7\u09B2\u0995\u09BE\u0964",
    shortDescriptionEn: "Heritage alkaline wild greens soup cooked without oil using sodium bicarbonate and tender local napa greens in Himalayan North Bengal.",
    detailedDescriptionBn: "\u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C7\u09B0 \u09B8\u09B0\u09CD\u09AC\u0989\u09A4\u09CD\u09A4\u09B0\u09C7\u09B0 \u09B9\u09BF\u09AE\u09BE\u09B2\u09AF\u09BC\u0995\u09A8\u09CD\u09AF\u09BE \u09AA\u099E\u09CD\u099A\u0997\u09A1\u09BC \u099C\u09C7\u09B2\u09BE\u09B0 \u09A8\u09BF\u099C\u09B8\u09CD\u09AC \u09B0\u09A8\u09CD\u09A7\u09A8\u09B8\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF\u09B0 \u09AA\u09CD\u09B0\u09A7\u09BE\u09A8 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF \u09B9\u09B2\u09CB \u2018\u09AA\u09C7\u09B2\u0995\u09BE\u2019 \u0993 \u2018\u099B\u09CD\u09AF\u09BE\u0995\u09BE\u2019\u0964 \u09A8\u09BE\u09AA\u09BE \u09B6\u09BE\u0995, \u09AA\u09BE\u099F \u09B6\u09BE\u0995 \u09AC\u09BE \u09AC\u09A5\u09C1\u09AF\u09BC\u09BE \u09B6\u09BE\u0995\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09B0\u09B8\u09C1\u09A8, \u0995\u09BE\u0981\u099A\u09BE \u09AE\u09B0\u09BF\u099A \u098F\u09AC\u0982 \u09B8\u09BE\u09AE\u09BE\u09A8\u09CD\u09AF \u0996\u09BE\u09AC\u09BE\u09B0 \u09B8\u09CB\u09A1\u09BE \u09AC\u09BE \u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8 \u0995\u09B2\u09BE\u09B0 \u0995\u09CD\u09B7\u09BE\u09B0 \u09A6\u09BF\u09AF\u09BC\u09C7 \u0995\u09CB\u09A8\u09CB \u09AA\u09CD\u09B0\u0995\u09BE\u09B0 \u09A4\u09C7\u09B2 \u099B\u09BE\u09A1\u09BC\u09BE \u098F\u0987 \u0998\u09A8 \u09AD\u09C7\u09B7\u099C \u09B8\u09CD\u09AF\u09C1\u09AA \u09A4\u09C8\u09B0\u09BF \u09B9\u09AF\u09BC\u0964 \u098F\u099F\u09BF \u09B9\u099C\u09AE\u0995\u09BE\u09B0\u0995 \u0993 \u0994\u09B7\u09A7\u09BF \u0997\u09C1\u09A3\u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u09AF\u09BE \u0997\u09B0\u09AE \u09AD\u09BE\u09A4\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u0996\u09BE\u0993\u09AF\u09BC\u09BE \u09B9\u09AF\u09BC\u0964",
    detailedDescriptionEn: 'Pelka is the ancient culinary identity of Himalayan North Bengal, specifically Panchagarh and Nilphamari. Crafted completely oil-free, freshly harvested napa greens, tender jute leaves, and wild bathua are simmered gently with baking soda (or traditional plant-ash alkaline potash "chhyaka"), crushed garlic, and green chilies into a nourishing, soothing soup.',
    ingredients: ["\u09A8\u09BE\u09AA\u09BE \u09B6\u09BE\u0995 \u0993 \u09AA\u09BE\u099F \u09B6\u09BE\u0995 (Napa & Jute Greens)", "\u0996\u09BE\u09AC\u09BE\u09B0 \u09B8\u09CB\u09A1\u09BE \u09AC\u09BE \u0995\u09B2\u09BE\u09B0 \u0995\u09CD\u09B7\u09BE\u09B0 (Baking Soda or Plant Potash)", "\u09B0\u09B8\u09C1\u09A8 \u0993 \u0995\u09BE\u0981\u099A\u09BE \u09AE\u09B0\u09BF\u099A (Crushed Garlic & Green Chilies)", "\u09B2\u09AC\u09A3 (Salt)"],
    preparationMethodEn: "Greens are chopped fine and boiled vigorously in water with a pinch of cooking soda until broken down into a smooth, emulsified green pur\xE9e with mashed garlic.",
    preparationMethodBn: "\u09A4\u09C7\u09B2 \u099B\u09BE\u09A1\u09BC\u09BE \u09AB\u09C1\u099F\u09A8\u09CD\u09A4 \u09AA\u09BE\u09A8\u09BF\u09A4\u09C7 \u0996\u09BE\u09AC\u09BE\u09B0 \u09B8\u09CB\u09A1\u09BE \u09AC\u09BE \u0995\u09CD\u09B7\u09BE\u09B0 \u09A6\u09BF\u09AF\u09BC\u09C7 \u09B6\u09BE\u0995, \u09B0\u09B8\u09C1\u09A8 \u0993 \u0995\u09BE\u0981\u099A\u09BE \u09AE\u09B0\u09BF\u099A \u09B8\u09C7\u09A6\u09CD\u09A7 \u0995\u09B0\u09C7 \u0995\u09BE\u09A0\u09C7\u09B0 \u0998\u09C1\u0981\u099F\u09A8\u09BF \u09A6\u09BF\u09AF\u09BC\u09C7 \u09AE\u09B8\u09C3\u09A3 \u09B8\u09CD\u09AF\u09C1\u09AA \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Extensively documented in North Bengal folk anthropology and indigenous Rajbanshi cultural studies.",
    historicalContextBn: "\u0989\u09A4\u09CD\u09A4\u09B0\u09AC\u0999\u09CD\u0997\u09C7\u09B0 \u09B0\u09BE\u099C\u09AC\u0982\u09B6\u09C0 \u0993 \u09B8\u09CD\u09A5\u09BE\u09A8\u09C0\u09AF\u09BC \u0997\u09CD\u09B0\u09BE\u09AE\u09C0\u09A3 \u099C\u09A8\u09AA\u09A6\u09C7\u09B0 \u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8\u09A4\u09AE \u09A4\u09C7\u09B2\u09AC\u09BF\u09B9\u09C0\u09A8 \u09AA\u09C1\u09B7\u09CD\u099F\u09BF\u0995\u09B0 \u09B0\u09A8\u09CD\u09A7\u09A8\u09B6\u09C8\u09B2\u09C0\u0964",
    primarySource: "North Bengal Folk Heritage Register & Panchagarh District Administration",
    citationSources: [
      "North Bengal Folk Cultural Society Records",
      "Panchagarh District Administration Cultural Profile",
      "Banglapedia: Folk Cuisine and Customs of Rangpur Region"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Vibrant green velvety Pelka soup served in an authentic rural ceramic bowl garnished with whole green chilies.",
    imageAttribution: "North Bengal Folk Archive"
  },
  thakurgaon: {
    districtId: "thakurgaon",
    districtNameEn: "Thakurgaon",
    districtNameBn: "\u09A0\u09BE\u0995\u09C1\u09B0\u0997\u09BE\u0981\u0993",
    divisionId: "rangpur",
    divisionNameEn: "Rangpur",
    foodNameEn: "Thakurgaon Shidol Bharta & Sura Pitha",
    foodNameBn: "\u09A0\u09BE\u0995\u09C1\u09B0\u0997\u09BE\u0981\u0993\u09AF\u09BC\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09B8\u09BF\u09A6\u09B2 \u09AD\u09B0\u09CD\u09A4\u09BE \u0993 \u09B8\u09C1\u09B0\u09BE \u09AA\u09BF\u09A0\u09BE",
    category: "traditional",
    dietaryType: "non-veg",
    approximatePriceBdt: 130,
    shortDescriptionBn: "\u09AE\u09BE\u09A8\u0995\u099A\u09C1 \u0993 \u099B\u09CB\u099F \u09A6\u09C7\u09B6\u09BF \u09AE\u09BE\u099B \u0997\u09C1\u0981\u09DC\u09CB \u0995\u09B0\u09C7 \u09B0\u09CB\u09A6\u09C7 \u09B6\u09C1\u0995\u09BF\u09AF\u09BC\u09C7 \u09A4\u09C8\u09B0\u09BF \u0990\u09A4\u09BF\u09B9\u09BE\u09B8\u09BF\u0995 \u09B8\u09BF\u09A6\u09B2 \u09AD\u09B0\u09CD\u09A4\u09BE \u098F\u09AC\u0982 \u09B6\u09C0\u09A4\u09C7\u09B0 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09B8\u09C1\u09B0\u09BE \u09AA\u09BF\u09A0\u09BE\u0964",
    shortDescriptionEn: "Fermented small indigenous fish and taro root paste dried into savory cakes (Shidol) mashed with hot chilies, paired with winter rice pithas.",
    detailedDescriptionBn: "\u09A0\u09BE\u0995\u09C1\u09B0\u0997\u09BE\u0981\u0993 \u0993 \u0989\u09A4\u09CD\u09A4\u09B0\u09C7\u09B0 \u09AC\u09B0\u09C7\u09A8\u09CD\u09A6\u09CD\u09B0 \u0985\u099E\u09CD\u099A\u09B2\u09C7\u09B0 \u098F\u0995 \u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8 \u09B2\u09CB\u0995\u0996\u09BE\u09A6\u09CD\u09AF \u09B9\u09B2\u09CB \u09B8\u09BF\u09A6\u09B2\u0964 \u099B\u09CB\u099F \u09A6\u09C7\u09B6\u09BF \u09AE\u09BE\u099B (\u099F\u09BE\u0995\u09BF \u09AC\u09BE \u09AA\u09C1\u0981\u099F\u09BF) \u098F\u09AC\u0982 \u09AC\u09C1\u09A8\u09CB \u09AE\u09BE\u09A8\u0995\u099A\u09C1 \u09AC\u09BE \u0995\u099A\u09C1\u09B0 \u09A1\u09BE\u0981\u099F\u09BE \u098F\u0995\u09B8\u09BE\u09A5\u09C7 \u09A2\u09C7\u0981\u0995\u09BF\u09A4\u09C7 \u0997\u09C1\u0981\u09A1\u09BC\u09CB \u0995\u09B0\u09C7 \u09AE\u09C7\u0996\u09C7 \u0997\u09CB\u09B2 \u099A\u09CD\u09AF\u09BE\u09AA\u09CD\u099F\u09BE \u09AC\u09B2 \u09AC\u09BE\u09A8\u09BF\u09AF\u09BC\u09C7 \u09B0\u09CB\u09A6\u09C7 \u09B6\u09C1\u0995\u09BF\u09AF\u09BC\u09C7 \u0997\u09BE\u0981\u099C\u09A8 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964 \u0996\u09BE\u0993\u09AF\u09BC\u09BE\u09B0 \u09B8\u09AE\u09AF\u09BC \u0986\u0997\u09C1\u09A8\u09C7 \u09AA\u09C1\u09A1\u09BC\u09BF\u09AF\u09BC\u09C7 \u09AC\u09BE \u09A4\u09C7\u09B2\u09C7 \u09AD\u09C7\u099C\u09C7 \u0995\u09BE\u0981\u099A\u09BE \u09AA\u09C7\u0981\u09AF\u09BC\u09BE\u099C \u0993 \u099D\u09BE\u09B2 \u09AE\u09B0\u09BF\u099A\u09C7 \u09AD\u09B0\u09CD\u09A4\u09BE \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964 \u09B6\u09C0\u09A4\u0995\u09BE\u09B2\u09C7 \u098F\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09B8\u09C1\u09B0\u09BE \u09AA\u09BF\u09A0\u09BE \u0985\u09A4\u09CD\u09AF\u09A8\u09CD\u09A4 \u099C\u09A8\u09AA\u09CD\u09B0\u09BF\u09AF\u09BC\u0964",
    detailedDescriptionEn: "Shidol is an ancestral fermented fish preparation of Thakurgaon and Greater Dinajpur. Small freshwater fish (mola, punti, or taki) are sun-dried, pounded with wild giant taro root, shaped into oval patties, and cured in earthenware urns. Roasted over embers and mashed with pungent mustard oil, raw shallots, and green chilies, it provides intense umami depth.",
    ingredients: ["\u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09B8\u09BF\u09A6\u09B2\u09C7\u09B0 \u099A\u09BE\u0995\u09BE (Fermented Shidol Fish Cake)", "\u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2 (Mustard Oil)", "\u09B6\u09C1\u0995\u09A8\u09BE \u09AC\u09BE \u0995\u09BE\u0981\u099A\u09BE \u09AE\u09B0\u09BF\u099A (Roasted Dried or Green Chilies)", "\u09AA\u09C7\u0981\u09AF\u09BC\u09BE\u099C \u0993 \u09B0\u09B8\u09C1\u09A8 \u0995\u09C1\u099A\u09BF (Minced Onions & Garlic)"],
    preparationMethodEn: "The cured shidol cake is toasted over embers until aromatic, then hand-mashed in a mortar with raw onions, roasted chilies, and cold-pressed mustard oil.",
    preparationMethodBn: "\u09B8\u09BF\u09A6\u09B2\u09C7\u09B0 \u099A\u09BE\u0995\u09BE \u0986\u0997\u09C1\u09A8\u09C7 \u09B9\u09BE\u09B2\u0995\u09BE \u09AA\u09C1\u09A1\u09BC\u09BF\u09AF\u09BC\u09C7 \u09AA\u09BE\u099F\u09BE\u09AF\u09BC \u09AA\u09BF\u09B7\u09C7 \u09AD\u09BE\u099C\u09BE \u09B6\u09C1\u0995\u09A8\u09BE \u09AE\u09B0\u09BF\u099A, \u09B0\u09B8\u09C1\u09A8, \u09AA\u09C7\u0981\u09AF\u09BC\u09BE\u099C \u0993 \u0996\u09BE\u0981\u099F\u09BF \u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2\u09C7 \u09AE\u09C7\u0996\u09C7 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09AD\u09B0\u09CD\u09A4\u09BE \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented in Northern Bengal agrarian ethnography and traditional food preservation heritage records.",
    historicalContextBn: "\u0989\u09A4\u09CD\u09A4\u09B0\u09AC\u0999\u09CD\u0997\u09C7\u09B0 \u0995\u09C3\u09B7\u09BF\u099C\u09C0\u09AC\u09C0 \u09AA\u09B0\u09BF\u09AC\u09BE\u09B0\u0997\u09C1\u09B2\u09CB\u09A4\u09C7 \u09AC\u09B0\u09CD\u09B7\u09BE \u0993 \u09B6\u09C0\u09A4\u0995\u09BE\u09B2\u09C7\u09B0 \u0996\u09BE\u09A6\u09CD\u09AF \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3\u09C7\u09B0 \u09B6\u09A4\u09AC\u09B0\u09CD\u09B7\u09C0 \u09B2\u09CB\u0995-\u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u0964",
    primarySource: "Thakurgaon District Administration & Northern Bengal Folk Study",
    citationSources: [
      "Thakurgaon District Administration Cultural Registry",
      "The Daily Star: Preserved Delicacies of Northern Bengal",
      "Banglapedia: Traditional Food Processing and Preservation in Bengal"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Rustic dark brown textured Shidol Bharta topped with raw shallots and mustard oil beside steamed white rice dumplings.",
    imageAttribution: "North Bengal Traditional Food Documentation"
  },
  kurigram: {
    districtId: "kurigram",
    districtNameEn: "Kurigram",
    districtNameBn: "\u0995\u09C1\u09DC\u09BF\u0997\u09CD\u09B0\u09BE\u09AE",
    divisionId: "rangpur",
    divisionNameEn: "Rangpur",
    foodNameEn: "Brahmaputra Char Fish & Kurigram Kheer Chomchom",
    foodNameBn: "\u09AC\u09CD\u09B0\u09B9\u09CD\u09AE\u09AA\u09C1\u09A4\u09CD\u09B0\u09C7\u09B0 \u099A\u09B0\u09C7\u09B0 \u09AC\u09C8\u09B0\u09BE\u09B2\u09C0 \u09AE\u09BE\u099B\u09C7\u09B0 \u099A\u099A\u09CD\u099A\u09DC\u09BF \u0993 \u0995\u09C1\u09DC\u09BF\u0997\u09CD\u09B0\u09BE\u09AE\u09C7\u09B0 \u0995\u09CD\u09B7\u09C0\u09B0 \u099A\u09AE\u099A\u09AE",
    category: "main_course",
    dietaryType: "non-veg",
    approximatePriceBdt: 210,
    shortDescriptionBn: "\u09AC\u09CD\u09B0\u09B9\u09CD\u09AE\u09AA\u09C1\u09A4\u09CD\u09B0 \u09A8\u09A6\u09C7\u09B0 \u09A6\u09C1\u09B0\u09CD\u0997\u09AE \u099A\u09B0\u09C7\u09B0 \u09A4\u09BE\u099C\u09BE \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09AC\u09C8\u09B0\u09BE\u09B2\u09C0 \u09AE\u09BE\u099B\u09C7\u09B0 \u099A\u099A\u09CD\u099A\u09A1\u09BC\u09BF \u0993 \u0995\u09C1\u09A1\u09BC\u09BF\u0997\u09CD\u09B0\u09BE\u09AE \u09B6\u09B9\u09B0\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u0995\u09CD\u09B7\u09C0\u09B0 \u099A\u09AE\u099A\u09AE\u0964",
    shortDescriptionEn: "Delicate freshwater Bairali fish from the sandy Brahmaputra char shoals cooked dry with green chilies, followed by rich milk Kheer Chomchom.",
    detailedDescriptionBn: "\u0995\u09C1\u09A1\u09BC\u09BF\u0997\u09CD\u09B0\u09BE\u09AE \u099C\u09C7\u09B2\u09BE \u09AC\u09CD\u09B0\u09B9\u09CD\u09AE\u09AA\u09C1\u09A4\u09CD\u09B0, \u09A7\u09B0\u09B2\u09BE \u0993 \u09A6\u09C1\u09A7\u0995\u09C1\u09AE\u09BE\u09B0 \u09A8\u09A6\u09C0\u09B0 \u099A\u09B0\u09BE\u099E\u09CD\u099A\u09B2 \u09A6\u09CD\u09AC\u09BE\u09B0\u09BE \u09AC\u09C7\u09B7\u09CD\u099F\u09BF\u09A4\u0964 \u098F\u0996\u09BE\u09A8\u0995\u09BE\u09B0 \u09AC\u09BE\u09B2\u09C1\u0995\u09BE\u09AE\u09AF\u09BC \u09B8\u09CD\u09AC\u099A\u09CD\u099B \u09A8\u09A6\u09C0\u09B0 \u09AA\u09BE\u09A8\u09BF \u09A5\u09C7\u0995\u09C7 \u09A7\u09B0\u09BE \u09AC\u09C8\u09B0\u09BE\u09B2\u09C0 \u0993 \u09AC\u09BE\u09A4\u09BE\u09B8\u09BF \u09AE\u09BE\u099B\u09C7\u09B0 \u0995\u09BE\u0981\u099A\u09BE \u09AE\u09B0\u09BF\u099A \u0993 \u09AA\u09C7\u0981\u09AF\u09BC\u09BE\u099C \u09A6\u09BF\u09AF\u09BC\u09C7 \u099A\u099A\u09CD\u099A\u09A1\u09BC\u09BF \u0989\u09A4\u09CD\u09A4\u09B0\u09AC\u0999\u09CD\u0997\u09C7\u09B0 \u0985\u09A8\u09CD\u09AF\u09A4\u09AE \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u0996\u09BE\u09AC\u09BE\u09B0\u0964 \u0986\u09B9\u09BE\u09B0\u09C7\u09B0 \u09B6\u09C7\u09B7\u09C7 \u0995\u09C1\u09A1\u09BC\u09BF\u0997\u09CD\u09B0\u09BE\u09AE \u09B8\u09A6\u09B0\u09C7\u09B0 \u0998\u09CB\u09B7\u09AA\u099F\u09CD\u099F\u09BF\u09B0 \u0997\u09BE\u09A2\u09BC \u0995\u09CD\u09B7\u09C0\u09B0\u09C7 \u09AE\u09CB\u09A1\u09BC\u09BE\u09A8\u09CB \u0996\u09BE\u0981\u099F\u09BF \u099B\u09BE\u09A8\u09BE\u09B0 \u099A\u09AE\u099A\u09AE \u09AA\u09B0\u09BF\u09AC\u09C7\u09B6\u09A8\u09C7\u09B0 \u09B8\u09AE\u09C3\u09A6\u09CD\u09A7 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF \u09B0\u09AF\u09BC\u09C7\u099B\u09C7\u0964",
    detailedDescriptionEn: "Bordered by the Brahmaputra and Dharla river networks, Kurigram is celebrated for fresh, sweet Bairali fish harvested from sandy char currents. Braised dry with slivered shallots, green chilies, and mustard oil, it offers pristine riverine freshness, traditionally concluded with Kurigram town\u2019s dense, kheer-coated Chomchom.",
    ingredients: ["\u09AC\u09CD\u09B0\u09B9\u09CD\u09AE\u09AA\u09C1\u09A4\u09CD\u09B0\u09C7\u09B0 \u09A4\u09BE\u099C\u09BE \u09AC\u09C8\u09B0\u09BE\u09B2\u09C0 \u09AE\u09BE\u099B (Fresh Brahmaputra Bairali Fish)", "\u09AA\u09C7\u0981\u09AF\u09BC\u09BE\u099C \u0995\u09C1\u099A\u09BF \u0993 \u0995\u09BE\u0981\u099A\u09BE \u09AE\u09B0\u09BF\u099A (Sliced Shallots & Green Chilies)", "\u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2 (Mustard Oil)", "\u0996\u09BE\u0981\u099F\u09BF \u099B\u09BE\u09A8\u09BE\u09B0 \u099A\u09AE\u099A\u09AE (Chhana Chomchom for dessert)"],
    preparationMethodEn: "Small fish are arranged in a flat pan with sliced onions, turmeric, and mustard oil, and simmered with a splash of water until completely dry and caramelized.",
    preparationMethodBn: "\u099B\u09CB\u099F \u09AC\u09C8\u09B0\u09BE\u09B2\u09C0 \u09AE\u09BE\u099B \u09B9\u09BE\u09A4 \u09A6\u09BF\u09AF\u09BC\u09C7 \u09AA\u09C7\u0981\u09AF\u09BC\u09BE\u099C, \u09AE\u09B0\u09BF\u099A \u0993 \u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2\u09C7 \u0986\u09B2\u09A4\u09CB \u0995\u09B0\u09C7 \u09AE\u09C7\u0996\u09C7 \u0985\u09B2\u09CD\u09AA \u09AA\u09BE\u09A8\u09BF\u09A4\u09C7 \u09A2\u09BF\u09AE\u09C7 \u0986\u0981\u099A\u09C7 \u0995\u09A1\u09BC\u09BE \u099A\u099A\u09CD\u099A\u09A1\u09BC\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented in river basin fisheries research and Kurigram district gazetteers as the hallmark char-land delicacy.",
    historicalContextBn: "\u0995\u09C1\u09A1\u09BC\u09BF\u0997\u09CD\u09B0\u09BE\u09AE\u09C7\u09B0 \u09A8\u09A6\u09C0\u09AE\u09BE\u09A4\u09C3\u0995 \u099C\u09C0\u09AC\u09A8 \u0993 \u09AC\u09CD\u09B0\u09B9\u09CD\u09AE\u09AA\u09C1\u09A4\u09CD\u09B0\u09C7\u09B0 \u099C\u09C7\u09B2\u09C7 \u09B8\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF\u09B0 \u0985\u09AC\u09BF\u099A\u09CD\u099B\u09C7\u09A6\u09CD\u09AF \u0985\u0982\u09B6 \u09AC\u09C8\u09B0\u09BE\u09B2\u09C0 \u09AE\u09BE\u099B\u09C7\u09B0 \u099A\u099A\u09CD\u099A\u09A1\u09BC\u09BF\u0964",
    primarySource: "Kurigram District Administration & Brahmaputra Basin Fisheries Chronicle",
    citationSources: [
      "Kurigram District Administration Cultural Affairs",
      "Department of Fisheries (DoF) Brahmaputra River Basin Agro-Study",
      "The Business Standard: Flavors of the Northern Borderlands"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Glistening dry-cooked freshwater fish caramelized with onions and green chilies served on a brass thali.",
    imageAttribution: "Brahmaputra River Heritage Archives"
  },
  lalmonirhat: {
    districtId: "lalmonirhat",
    districtNameEn: "Lalmonirhat",
    districtNameBn: "\u09B2\u09BE\u09B2\u09AE\u09A8\u09BF\u09B0\u09B9\u09BE\u099F",
    divisionId: "rangpur",
    divisionNameEn: "Rangpur",
    foodNameEn: "Teesta Bairali Macher Jhol & Shidol Vapa",
    foodNameBn: "\u09A4\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0 \u09A4\u09BE\u099C\u09BE \u09AC\u09C8\u09B0\u09BE\u09B2\u09C0 \u09AE\u09BE\u099B\u09C7\u09B0 \u099D\u09CB\u09B2 \u0993 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u09B8\u09BF\u09A6\u09B2 \u09AD\u09BE\u09AA\u09BE",
    category: "main_course",
    dietaryType: "non-veg",
    approximatePriceBdt: 220,
    shortDescriptionBn: "\u09A4\u09BF\u09B8\u09CD\u09A4\u09BE \u09A8\u09A6\u09C0\u09B0 \u09B8\u09CD\u09AB\u099F\u09BF\u0995\u09B8\u09CD\u09AC\u099A\u09CD\u099B \u09B8\u09CD\u09B0\u09CB\u09A4\u09C7\u09B0 \u09AC\u09C8\u09B0\u09BE\u09B2\u09C0 \u09AE\u09BE\u099B\u09C7\u09B0 \u09AA\u09BE\u09A4\u09B2\u09BE \u099D\u09CB\u09B2 \u0993 \u0995\u09B2\u09BE\u09AA\u09BE\u09A4\u09BE\u09AF\u09BC \u09AD\u09BE\u09AA\u09BE\u09A8\u09CB \u09B8\u09C1\u09AC\u09BE\u09B8\u09BF\u09A4 \u09B8\u09BF\u09A6\u09B2\u0964",
    shortDescriptionEn: "Pristine Teesta river Bairali fish in a light aromatic broth, accompanied by banana-leaf steamed fermented Shidol patties.",
    detailedDescriptionBn: "\u09B2\u09BE\u09B2\u09AE\u09A8\u09BF\u09B0\u09B9\u09BE\u099F\u09C7\u09B0 \u099C\u09C0\u09AC\u09A8\u09AA\u09CD\u09B0\u09AC\u09BE\u09B9 \u09A4\u09BF\u09B8\u09CD\u09A4\u09BE \u09A8\u09A6\u09C0\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09A8\u09BF\u09AC\u09BF\u09A1\u09BC\u09AD\u09BE\u09AC\u09C7 \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09BF\u09A4\u0964 \u09A4\u09BF\u09B8\u09CD\u09A4\u09BE \u09AC\u09CD\u09AF\u09BE\u09B0\u09C7\u099C \u0993 \u09A6\u09CB\u09AE\u09B9\u09A8\u09C0 \u098F\u09B2\u09BE\u0995\u09BE\u09B0 \u09B8\u09CD\u09AC\u099A\u09CD\u099B \u09AA\u09BE\u09A5\u09C1\u09B0\u09C7 \u09B8\u09CD\u09B0\u09CB\u09A4\u09C7 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u099B\u09CB\u099F \u099A\u0995\u099A\u0995\u09C7 \u09AC\u09C8\u09B0\u09BE\u09B2\u09C0 \u09AE\u09BE\u099B\u09C7\u09B0 \u09AA\u09BE\u09A4\u09B2\u09BE \u099C\u09BF\u09B0\u09BE \u09AC\u09BE\u099F\u09BE \u099D\u09CB\u09B2 \u09B8\u09CD\u09AC\u09BE\u09A6\u09C7 \u0993 \u09AA\u09C1\u09B7\u09CD\u099F\u09BF\u09A4\u09C7 \u0985\u09A8\u09A8\u09CD\u09AF\u0964 \u098F\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8 \u09B0\u09BE\u09A8\u09CD\u09A8\u09BE\u09B0 \u0995\u09BE\u09AF\u09BC\u09A6\u09BE\u09AF\u09BC \u0995\u09B2\u09BE\u09AA\u09BE\u09A4\u09BE\u09AF\u09BC \u09AE\u09C1\u09A1\u09BC\u09BF\u09AF\u09BC\u09C7 \u0995\u09AF\u09BC\u09B2\u09BE\u09B0 \u09A4\u09BE\u09AA\u09C7 \u09AD\u09BE\u09AA\u09BE\u09A8\u09CB \u2018\u09B8\u09BF\u09A6\u09B2 \u09AD\u09BE\u09AA\u09BE\u2019 \u09B2\u09BE\u09B2\u09AE\u09A8\u09BF\u09B0\u09B9\u09BE\u099F\u09C7\u09B0 \u0985\u09A8\u09CD\u09AF\u09A4\u09AE \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AA\u09A6\u0964",
    detailedDescriptionEn: "The pristine waters of the Teesta River in Lalmonirhat produce the prized Bairali fish, celebrated for its sweet, clean flavor. It is prepared in a light cumin and green chili broth. Locals also cherish Shidol Vapa\u2014fermented fish and taro patties wrapped securely in wild banana leaves and steamed over embers.",
    ingredients: ["\u09A4\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0 \u09A4\u09BE\u099C\u09BE \u09AC\u09C8\u09B0\u09BE\u09B2\u09C0 \u09AE\u09BE\u099B (Fresh Teesta Bairali Fish)", "\u099C\u09BF\u09B0\u09C7 \u09AC\u09BE\u099F\u09BE (Freshly Ground Cumin Paste)", "\u0995\u09BE\u0981\u099A\u09BE \u09AE\u09B0\u09BF\u099A \u0993 \u09B9\u09B2\u09C1\u09A6 (Green Chilies & Turmeric)", "\u0995\u09B2\u09BE\u09AA\u09BE\u09A4\u09BE\u09AF\u09BC \u09AE\u09CB\u09A1\u09BC\u09BE\u09A8\u09CB \u09B8\u09BF\u09A6\u09B2 (Banana-Leaf Steamed Shidol)"],
    preparationMethodEn: "Freshly caught fish are gently simmered in a light cumin-scented broth, while fermented shidol paste is wrapped in scorched banana leaves and pan-steamed.",
    preparationMethodBn: "\u09A4\u09BE\u099C\u09BE \u09AE\u09BE\u099B \u09A7\u09C1\u09DF\u09C7 \u09B9\u09BE\u09B2\u0995\u09BE \u099C\u09BF\u09B0\u09C7 \u09AC\u09BE\u099F\u09BE \u0993 \u0995\u09BE\u0981\u099A\u09BE \u09AE\u09B0\u09BF\u099A\u09C7\u09B0 \u09B9\u09BE\u09B2\u0995\u09BE \u099D\u09CB\u09B2\u09C7 \u09B0\u09BE\u09A8\u09CD\u09A8\u09BE \u0995\u09B0\u09BE \u09B9\u09AF\u09BC \u098F\u09AC\u0982 \u0995\u09B2\u09BE\u09AA\u09BE\u09A4\u09BE \u09AE\u09C1\u09A1\u09BC\u09C7 \u0995\u09AF\u09BC\u09B2\u09BE\u09B0 \u0986\u0981\u099A\u09C7 \u09B8\u09BF\u09A6\u09B2 \u09AD\u09BE\u09AA\u09BE\u09A8\u09CB \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented in Teesta river basin historical records and northern borderland gastronomic registers.",
    historicalContextBn: "\u09A4\u09BF\u09B8\u09CD\u09A4\u09BE\u09AA\u09BE\u09A1\u09BC\u09C7\u09B0 \u099C\u09C7\u09B2\u09C7 \u09B8\u09AE\u09BE\u099C \u0993 \u0989\u09A4\u09CD\u09A4\u09B0\u09AC\u0999\u09CD\u0997\u09C7\u09B0 \u09B2\u09CB\u0995\u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09C7\u09B0 \u09B6\u09A4\u09BE\u09AC\u09CD\u09A6\u09C0\u09AA\u09CD\u09B0\u09BE\u099A\u09C0\u09A8 \u09B0\u09A8\u09CD\u09A7\u09A8\u09B6\u09C8\u09B2\u09C0\u0964",
    primarySource: "Lalmonirhat District Administration & Teesta River Basin Historical Archives",
    citationSources: [
      "Lalmonirhat District Administration Official Registry",
      "Teesta River Basin Ecological & Folk Survey",
      "The Daily Star: Bairali Fish of the Northern Rivers"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Delicate river fish in a clear, golden cumin-infused broth with fresh coriander and sliced green chilies in a white bowl.",
    imageAttribution: "Teesta River Basin Cultural Archive"
  },
  nilphamari: {
    districtId: "nilphamari",
    districtNameEn: "Nilphamari",
    districtNameBn: "\u09A8\u09C0\u09B2\u09AB\u09BE\u09AE\u09BE\u09B0\u09C0",
    divisionId: "rangpur",
    divisionNameEn: "Rangpur",
    foodNameEn: "Saidpur Beef Seekh Kebab & Petha Mishti",
    foodNameBn: "\u09B8\u09C8\u09AF\u09BC\u09A6\u09AA\u09C1\u09B0\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AC\u09BF\u09AB \u09B6\u09BF\u0995 \u0995\u09BE\u09AC\u09BE\u09AC \u0993 \u09AA\u09C7\u09A0\u09BE \u09AE\u09BF\u09B7\u09CD\u099F\u09BF",
    category: "street_food",
    dietaryType: "non-veg",
    approximatePriceBdt: 190,
    shortDescriptionBn: "\u09B8\u09C8\u09AF\u09BC\u09A6\u09AA\u09C1\u09B0 \u09B0\u09C7\u09B2\u0993\u09AF\u09BC\u09C7 \u09B6\u09B9\u09B0\u09C7\u09B0 \u09B6\u09A4\u09BE\u09AC\u09CD\u09A6\u09C0\u09B0 \u09AA\u09C1\u09B0\u09CB\u09A8\u09CB \u09AE\u09B6\u09B2\u09BE\u09A6\u09BE\u09B0 \u0997\u09B0\u09C1\u09B0 \u09B6\u09BF\u0995 \u0995\u09BE\u09AC\u09BE\u09AC, \u09AC\u09BE\u0995\u09B0\u0996\u09BE\u09A8\u09BF \u098F\u09AC\u0982 \u09B0\u09B8\u09BE\u09B2\u09CB \u09AA\u09C7\u09A0\u09BE \u09AE\u09BF\u09B7\u09CD\u099F\u09BF\u0964",
    shortDescriptionEn: "Centuries-old artisanal spiced beef seekh kebabs grilled over charcoal in railway hub Saidpur, paired with candied ash gourd Petha.",
    detailedDescriptionBn: "\u09A8\u09C0\u09B2\u09AB\u09BE\u09AE\u09BE\u09B0\u09C0\u09B0 \u09B8\u09C8\u09AF\u09BC\u09A6\u09AA\u09C1\u09B0 \u098F\u0995\u099F\u09BF \u0990\u09A4\u09BF\u09B9\u09BE\u09B8\u09BF\u0995 \u09B0\u09C7\u09B2\u0993\u09AF\u09BC\u09C7 \u09B6\u09B9\u09B0, \u09AF\u09BE\u09B0 \u09AE\u09BF\u09B6\u09CD\u09B0 \u09B8\u09BE\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF\u0995 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09C7 \u09AE\u09CB\u0997\u09B2\u09BE\u0987 \u0993 \u0989\u09B0\u09CD\u09A6\u09C1\u09AD\u09BE\u09B7\u09C0 \u09B0\u09A8\u09CD\u09A7\u09A8\u09B6\u09C8\u09B2\u09C0\u09B0 \u0997\u09AD\u09C0\u09B0 \u09AA\u09CD\u09B0\u09AD\u09BE\u09AC \u09B0\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u098F\u0996\u09BE\u09A8\u0995\u09BE\u09B0 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u09B6\u09BF\u0995 \u0995\u09BE\u09AC\u09BE\u09AC \u0993 \u0997\u09B0\u09C1\u09B0 \u099A\u09BE\u09AA \u0995\u09BE\u09A0\u0995\u09AF\u09BC\u09B2\u09BE\u09B0 \u0986\u0997\u09C1\u09A8\u09C7 \u09AD\u09C7\u099C\u09C7 \u09A4\u09BE\u099C\u09BE \u09AA\u09C7\u0981\u09AF\u09BC\u09BE\u099C \u0993 \u09AA\u09C1\u09A6\u09BF\u09A8\u09BE\u09B0 \u099A\u09BE\u099F\u09A8\u09BF \u09B8\u09B9\u09AF\u09CB\u0997\u09C7 \u09AA\u09B0\u09BF\u09AC\u09C7\u09B6\u09A8 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964 \u0986\u09B9\u09BE\u09B0\u09C7\u09B0 \u09B6\u09C7\u09B7\u09C7 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u099A\u09BE\u09B2\u0995\u09C1\u09AE\u09A1\u09BC\u09BE\u09B0 \u09AE\u09BF\u09B7\u09CD\u099F\u09BF \u09AA\u09C7\u09A0\u09BE \u09AA\u09B0\u09BF\u09AC\u09C7\u09B6\u09A8 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    detailedDescriptionEn: "Saidpur in Nilphamari is a historic railway junction whose multicultural population established a renowned North Indian culinary enclave. hereditary Ustads marinate spiced minced beef on iron skewers over charcoal braziers to yield smokey, melt-in-the-mouth Seekh Kebabs and Chaap, concluded with crystal-sweet Petha.",
    ingredients: ["\u0996\u09BE\u0981\u099F\u09BF \u0997\u09B0\u09C1\u09B0 \u0995\u09BF\u09AE\u09BE \u0993 \u09AE\u09BE\u0982\u09B8 (Minced Beef & Marinated Beef Cuts)", "\u09AC\u09BF\u09B6\u09C7\u09B7 \u0995\u09BE\u09AC\u09BE\u09AC \u09AE\u09B6\u09B2\u09BE (Artisanal Kebab Spices: Papaya, Nutmeg, Mace)", "\u09B8\u09B0\u09CD\u09B7\u09C7\u09B0 \u09A4\u09C7\u09B2 (Mustard Oil for Basting)", "\u099A\u09BE\u09B2\u0995\u09C1\u09AE\u09A1\u09BC\u09BE (Candied Ash Gourd for Petha)"],
    preparationMethodEn: "Minced beef marinated with raw papaya and aromatic spices is skewered onto long iron rods and grilled over smoldering coals until deeply charred.",
    preparationMethodBn: "\u0995\u09BE\u0981\u099A\u09BE \u09AA\u09C7\u0981\u09AA\u09C7 \u09AC\u09BE\u099F\u09BE \u0993 \u09B6\u09BE\u09B9\u09C0 \u09AE\u09B6\u09B2\u09BE\u09AF\u09BC \u09AE\u09BE\u0996\u09BE\u09A8\u09CB \u0997\u09B0\u09C1\u09B0 \u09AE\u09BE\u0982\u09B8\u09C7\u09B0 \u0995\u09BF\u09AE\u09BE \u09B2\u09CB\u09B9\u09BE\u09B0 \u09B6\u09BF\u0995\u09C7 \u0997\u09C7\u0981\u09A5\u09C7 \u0995\u09BE\u09A0\u0995\u09AF\u09BC\u09B2\u09BE\u09B0 \u0986\u0981\u099A\u09C7 \u09AA\u09C1\u09A1\u09BC\u09BF\u09AF\u09BC\u09C7 \u0995\u09BE\u09AC\u09BE\u09AC \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Documented in Bengal-Assam railway junction archives and North Bengal heritage culinary records.",
    historicalContextBn: "\u09B8\u09C8\u09AF\u09BC\u09A6\u09AA\u09C1\u09B0\u09C7\u09B0 \u09B6\u09A4\u09AC\u09B0\u09CD\u09B7\u09C0 \u09B2\u09CB\u0995\u09B8\u0982\u09B8\u09CD\u0995\u09C3\u09A4\u09BF \u0993 \u09B0\u09C7\u09B2\u0993\u09AF\u09BC\u09C7 \u0989\u09AA\u09A8\u09BF\u09AC\u09C7\u09B6\u09C7\u09B0 \u09AE\u09BF\u09B6\u09CD\u09B0 \u09B0\u09A8\u09CD\u09A7\u09A8\u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u0964",
    primarySource: "Nilphamari District Administration & Saidpur Heritage Chronicles",
    citationSources: [
      "The Business Standard: The legendary street kebabs of railway town Saidpur",
      "Nilphamari District Administration Cultural Affairs",
      "Folklore Archive of Northern Bengal"
    ],
    researchStatus: "verified",
    isGiProduct: false,
    imageSuggestionPrompt: "Tender charred beef seekh kebabs on iron skewers garnished with sliced red onions, lime wedges, and mint chutney.",
    imageAttribution: "Saidpur Culinary Heritage Society"
  },
  sherpur: {
    districtId: "sherpur",
    districtNameEn: "Sherpur",
    districtNameBn: "\u09B6\u09C7\u09B0\u09AA\u09C1\u09B0",
    divisionId: "mymensingh",
    divisionNameEn: "Mymensingh",
    foodNameEn: "Sherpur GI Chhanar Payesh & Tulshimala Rice",
    foodNameBn: "\u09B6\u09C7\u09B0\u09AA\u09C1\u09B0\u09C7\u09B0 \u099C\u09BF\u0986\u0987 \u09B8\u09A8\u09A6\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4 \u099B\u09BE\u09A8\u09BE\u09B0 \u09AA\u09BE\u09AF\u09BC\u09C7\u09B8 \u0993 \u09A4\u09C1\u09B2\u09B6\u09C0\u09AE\u09BE\u09B2\u09BE \u099A\u09BE\u09B2\u09C7\u09B0 \u09AA\u09CB\u09B2\u09BE\u0993",
    category: "dessert",
    dietaryType: "sweet",
    approximatePriceBdt: 240,
    shortDescriptionBn: "\u09B6\u09A4\u09AC\u09B0\u09CD\u09B7\u09C0 \u09AC\u09CD\u09B0\u09BF\u099F\u09BF\u09B6 \u0986\u09AE\u09B2\u09C7\u09B0 \u099C\u09BF\u0986\u0987 \u09B8\u09A8\u09A6\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4 \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u099B\u09BE\u09A8\u09BE\u09B0 \u09AA\u09BE\u09AF\u09BC\u09C7\u09B8 \u098F\u09AC\u0982 \u09B8\u09C1\u0997\u09A8\u09CD\u09A7\u09BF \u09A4\u09C1\u09B2\u09B6\u09C0\u09AE\u09BE\u09B2\u09BE \u099A\u09BE\u09B2\u09C7\u09B0 \u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09AA\u09A6\u0964",
    shortDescriptionEn: "Official GI-certified centennial Chhanar Payesh crafted by Ghosh Patti sweetmakers and the legendary fragrant Tulshimala rice of Sherpur.",
    detailedDescriptionBn: "\u09B6\u09C7\u09B0\u09AA\u09C1\u09B0 \u099C\u09C7\u09B2\u09BE\u09B0 \u0985\u09A8\u09CD\u09AF\u09A4\u09AE \u09AA\u09CD\u09B0\u09A7\u09BE\u09A8 \u0985\u09B9\u0982\u0995\u09BE\u09B0 \u09B9\u09B2\u09CB \u098F\u09B0 \u09A6\u09C1\u099F\u09BF \u0985\u09AB\u09BF\u09B8\u09BF\u09AF\u09BC\u09BE\u09B2 \u09AD\u09CC\u0997\u09CB\u09B2\u09BF\u0995 \u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6\u0995 (GI) \u09AA\u09A3\u09CD\u09AF\u2014\u2018\u099B\u09BE\u09A8\u09BE\u09B0 \u09AA\u09BE\u09AF\u09BC\u09C7\u09B8\u2019 \u098F\u09AC\u0982 \u09B8\u09C1\u0997\u09A8\u09CD\u09A7\u09BF \u2018\u09A4\u09C1\u09B2\u09B6\u09C0\u09AE\u09BE\u09B2\u09BE \u099A\u09BE\u09B2\u2019\u0964 \u09AC\u09CD\u09B0\u09BF\u099F\u09BF\u09B6 \u0986\u09AE\u09B2\u09C7 \u09B6\u09C7\u09B0\u09AA\u09C1\u09B0 \u09B6\u09B9\u09B0\u09C7\u09B0 \u0998\u09CB\u09B7 \u09AA\u099F\u09CD\u099F\u09BF\u09B0 \u09AE\u09AF\u09BC\u09B0\u09BE\u09A6\u09C7\u09B0 \u09A4\u09C8\u09B0\u09BF \u099B\u09BE\u09A8\u09BE\u09B0 \u09AA\u09BE\u09AF\u09BC\u09C7\u09B8 \u099C\u09AE\u09BF\u09A6\u09BE\u09B0 \u0993 \u0985\u09AD\u09BF\u099C\u09BE\u09A4\u09A6\u09C7\u09B0 \u0986\u09AA\u09CD\u09AF\u09BE\u09AF\u09BC\u09A8\u09C7 \u09AC\u09CD\u09AF\u09AC\u09B9\u09C3\u09A4 \u09B9\u09A4\u09CB\u0964 \u0996\u09BE\u0981\u099F\u09BF \u09A6\u09C1\u09A7 \u0998\u09A8 \u0995\u09CD\u09B7\u09C0\u09B0 \u0995\u09B0\u09C7 \u09A4\u09BE\u09A4\u09C7 \u099B\u09CB\u099F \u099B\u09CB\u099F \u099B\u09BE\u09A8\u09BE\u09B0 \u0997\u09C1\u099F\u09BF \u09A6\u09BF\u09AF\u09BC\u09C7 \u09A4\u09C8\u09B0\u09BF \u09B9\u09AF\u09BC \u098F\u0987 \u0985\u09A8\u09C1\u09AA\u09AE \u09AE\u09BF\u09B7\u09CD\u099F\u09BE\u09A8\u09CD\u09A8\u0964",
    detailedDescriptionEn: "Sherpur holds the distinction of having two celebrated Geographical Indication (GI) products: Chhanar Payesh (GI #44) and aromatic Tulshimala rice. Created in Ghosh Patti during the British Raj, small globules of fresh cow milk chhana are cooked in boiling syrup and gently folded into rich, creamy condensed milk.",
    ingredients: ["\u0996\u09BE\u0981\u099F\u09BF \u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7\u09C7\u09B0 \u099B\u09BE\u09A8\u09BE (Fresh Cow Milk Chhana)", "\u0998\u09A8 \u0995\u09CD\u09B7\u09C0\u09B0 \u0993 \u09AE\u09BE\u09B2\u09BE\u0987 (Reduced Milk Kheer)", "\u099A\u09BF\u09A8\u09BF\u09B0 \u09B8\u09BF\u09B0\u09BE (Sugar Syrup)", "\u09A4\u09C1\u09B2\u09B6\u09C0\u09AE\u09BE\u09B2\u09BE \u099A\u09BE\u09B2 (Aromatic Tulshimala Rice)"],
    preparationMethodEn: "Chhana is rolled into tiny bead-like pellets, lightly poached in sugar syrup, and simmered slowly in thick condensed milk infused with green cardamom.",
    preparationMethodBn: "\u09A4\u09BE\u099C\u09BE \u099B\u09BE\u09A8\u09BE \u09AE\u09C7\u0996\u09C7 \u099B\u09CB\u099F \u099B\u09CB\u099F \u09A6\u09BE\u09A8\u09BE\u09B0 \u09AE\u09A4\u09CB \u0997\u09C1\u099F\u09BF \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09C7 \u09B9\u09BE\u09B2\u0995\u09BE \u09B8\u09BF\u09B0\u09BE\u09AF\u09BC \u09B8\u09C7\u09A6\u09CD\u09A7 \u0995\u09B0\u09C7 \u098F\u09B2\u09BE\u099A\u09AE\u09BF\u09B6\u09CD\u09B0\u09BF\u09A4 \u0998\u09A8 \u099C\u09CD\u09AC\u09BE\u09B2 \u09A6\u09C7\u0993\u09AF\u09BC\u09BE \u09A6\u09C1\u09A7\u09C7\u09B0 \u0995\u09CD\u09B7\u09C0\u09B0\u09C7 \u09A1\u09C1\u09AC\u09BF\u09AF\u09BC\u09C7 \u09B0\u09BE\u0996\u09BE \u09B9\u09AF\u09BC\u0964",
    historicalContextEn: "Officially certified as Bangladesh Geographical Indication (GI) product #44 under the Ministry of Industries. Historically gifted to Zamindars.",
    historicalContextBn: "\u09B6\u09C7\u09B0\u09AA\u09C1\u09B0\u09C7\u09B0 \u099B\u09BE\u09A8\u09BE\u09B0 \u09AA\u09BE\u09AF\u09BC\u09C7\u09B8 \u098F\u09AC\u0982 \u09A4\u09C1\u09B2\u09B6\u09C0\u09AE\u09BE\u09B2\u09BE \u099A\u09BE\u09B2 \u0989\u09AD\u09AF\u09BC\u0987 \u099C\u09BE\u09A4\u09C0\u09AF\u09BC\u09AD\u09BE\u09AC\u09C7 \u09AD\u09CC\u0997\u09CB\u09B2\u09BF\u0995 \u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6\u0995 (GI) \u09B8\u09A8\u09A6 \u0985\u09B0\u09CD\u099C\u09A8 \u0995\u09B0\u09C7\u099B\u09C7\u0964",
    primarySource: "Department of Patents, Designs and Trademarks (DPDT) GI Registry #44",
    citationSources: [
      "The Daily Star: Sherpur\u2019s Chhanar Payesh receives GI recognition",
      "Dhaka Tribune: The century-old sweet heritage of Sherpur",
      "DPDT Official GI Registry #44 Gazette"
    ],
    researchStatus: "gi_certified",
    isGiProduct: true,
    giRegistrationInfo: "Registered Geographical Indication Product #44 (Ministry of Industries)",
    imageSuggestionPrompt: "Creamy golden-white Chhanar Payesh showing delicate soft chhana beads suspended in thick sweetened condensed milk.",
    imageAttribution: "Department of Patents, Designs and Trademarks / Foodie BD Archive"
  }
};

// server/routes.ts
var apiRouter = Router();
apiRouter.use(authenticate);
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5 MB
  }
});
apiRouter.get("/images/:filename", async (req, res) => {
  const fileName = req.params.filename;
  if (!fileName || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    res.status(400).json({ error: "Invalid file reference." });
    return;
  }
  const result = await imageStorage.getImage(fileName);
  if (!result) {
    res.status(404).json({ error: "Image file not found." });
    return;
  }
  res.setHeader("Content-Type", result.mimeType);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.send(result.buffer);
});
apiRouter.post("/upload/image", requireAuth, (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          error: "File size exceeds the 5 MB limit. (\u099B\u09AC\u09BF\u09B0 \u0986\u0995\u09BE\u09B0 \u09B8\u09B0\u09CD\u09AC\u09CB\u099A\u09CD\u099A \u09EB \u09AE\u09C7\u0997\u09BE\u09AC\u09BE\u0987\u099F \u09B9\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u0964)"
        });
        return;
      }
      res.status(400).json({ error: err.message || "File upload failed." });
      return;
    }
    const file = req.file;
    if (!file || !file.buffer) {
      res.status(400).json({
        error: "No image file provided. Please choose a valid image file. (\u0995\u09CB\u09A8\u09CB \u0987\u09AE\u09C7\u099C \u09AB\u09BE\u0987\u09B2 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964)"
      });
      return;
    }
    const currentUser = req.user;
    const { context, targetId } = req.body || {};
    if (context === "food" && currentUser.role !== "admin") {
      res.status(403).json({
        error: "Only administrators can upload or replace images for catalog foods."
      });
      return;
    }
    if (targetId && context === "submission") {
      const submission = await dal.getSubmissionById(targetId);
      if (submission) {
        if (currentUser.role !== "admin" && submission.userId !== currentUser.userId) {
          res.status(403).json({
            error: "You do not have permission to modify another user's submission image."
          });
          return;
        }
        if (currentUser.role !== "admin" && submission.status !== "pending") {
          res.status(400).json({
            error: "Cannot modify image for a submission that is already reviewed."
          });
          return;
        }
      }
    }
    const validation = validateImageBuffer(file.buffer);
    if (!validation.isValid) {
      res.status(400).json({
        error: `${validation.errorEn} (${validation.errorBn})`
      });
      return;
    }
    try {
      const prefix = context === "avatar" ? "avatar" : "food";
      const meta = await imageStorage.saveImage(
        file.buffer,
        file.originalname || `${prefix}_upload.jpg`,
        currentUser.userId,
        prefix
      );
      const dbUser = await dal.getUserById(currentUser.userId);
      await dal.logAudit({
        action: "IMAGE_UPLOADED",
        entityType: "IMAGE",
        entityId: meta.fileName,
        userId: currentUser.userId,
        userName: dbUser?.name || currentUser.email || "User",
        details: `Uploaded image ${meta.fileName} (${(meta.size / 1024).toFixed(1)} KB, ${meta.mimeType})`
      });
      res.status(201).json({
        success: true,
        message: "Image uploaded successfully.",
        imageUrl: meta.url,
        storagePath: meta.storagePath,
        fileName: meta.fileName,
        size: meta.size,
        mimeType: meta.mimeType,
        provider: imageStorage.getStorageProviderName()
      });
    } catch (saveErr) {
      console.error("Failed to save image:", saveErr);
      res.status(500).json({ error: saveErr.message || "Failed to save uploaded image." });
    }
  });
});
apiRouter.delete("/upload/image/:filename", requireAuth, async (req, res) => {
  const fileName = req.params.filename;
  if (!fileName || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    res.status(400).json({ error: "Invalid file reference." });
    return;
  }
  const fileTarget = `/api/images/${fileName}`;
  const allFoods = await dal.getFoods({ includeDrafts: true });
  const isUsedInFoods = allFoods.some((f) => f.imageUrl === fileTarget || f.imageUrl?.endsWith(fileName));
  if (isUsedInFoods && req.user?.role !== "admin") {
    res.status(403).json({ error: "Cannot delete image in use by catalog food." });
    return;
  }
  const allSubmissions = await dal.getSubmissions();
  const usedInSub = allSubmissions.find((s) => s.imageUrl === fileTarget || s.imageUrl?.endsWith(fileName));
  if (usedInSub && req.user?.role !== "admin" && usedInSub.userId !== req.user?.userId) {
    res.status(403).json({ error: "Cannot delete image attached to another user's submission." });
    return;
  }
  const deleted = await imageStorage.deleteImage(fileName);
  if (!deleted) {
    res.status(404).json({ error: "Image file not found or already removed." });
    return;
  }
  const dbUser = await dal.getUserById(req.user.userId);
  await dal.logAudit({
    action: "IMAGE_DELETED",
    entityType: "IMAGE",
    entityId: fileName,
    userId: req.user.userId,
    userName: dbUser?.name || req.user.email || "User",
    details: `Deleted image file ${fileName}`
  });
  res.json({ success: true, message: "Image deleted successfully." });
});
apiRouter.post("/auth/register", async (req, res) => {
  const { name, email, password, homeDistrictId } = req.body;
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({ error: "Valid name is required (minimum 2 characters)." });
    return;
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "Valid email address is required." });
    return;
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters long." });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await dal.getUserByEmail(normalizedEmail);
  if (existing) {
    res.status(409).json({ error: "An account with this email address already exists." });
    return;
  }
  const isPrimaryAdmin = normalizedEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();
  const assignedRole = isPrimaryAdmin ? "admin" : "user";
  const { hash, salt } = createPasswordRecord(password);
  const newUser = {
    id: isPrimaryAdmin ? "user_admin_primary" : "user_" + crypto4.randomUUID().slice(0, 8),
    name: name.trim(),
    email: normalizedEmail,
    role: assignedRole,
    passwordHash: hash,
    salt,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
    homeDistrictId: homeDistrictId || "dhaka",
    bio: isPrimaryAdmin ? "Head administrator and curator of Foodie BD." : void 0,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const createdUser = await dal.createUser(newUser);
  await dal.logAudit({
    action: "USER_REGISTERED",
    entityType: "USER",
    entityId: createdUser.id,
    userId: createdUser.id,
    userName: createdUser.name,
    details: `User registered with email ${createdUser.email} (role: ${createdUser.role})`
  });
  const token = generateToken(createdUser);
  const { passwordHash, salt: s, ...profile } = createdUser;
  res.status(201).json({ token, user: profile });
});
apiRouter.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const isPrimaryAdmin = normalizedEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();
  let user = await dal.getUserByEmail(normalizedEmail);
  if (isPrimaryAdmin) {
    if (!user) {
      const { hash, salt: salt2 } = createPasswordRecord(PRIMARY_ADMIN_PASSWORD);
      user = await dal.createUser({
        id: "user_admin_primary",
        name: "Salahuddin Azad (Admin)",
        email: PRIMARY_ADMIN_EMAIL,
        role: "admin",
        passwordHash: hash,
        salt: salt2,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=Salahuddin%20Azad`,
        homeDistrictId: "dhaka",
        bio: "Head administrator and curator of Foodie BD.",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } else {
      if (user.role !== "admin") {
        await dal.updateUserRole(user.id, "admin");
        user.role = "admin";
      }
      if (password === PRIMARY_ADMIN_PASSWORD && !verifyPassword(password, user.passwordHash, user.salt)) {
        const { hash, salt: salt2 } = createPasswordRecord(PRIMARY_ADMIN_PASSWORD);
        await dal.updateUserPassword(user.id, hash, salt2);
        user.passwordHash = hash;
        user.salt = salt2;
      }
    }
  }
  if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  if (isPrimaryAdmin) {
    user.role = "admin";
  }
  const token = generateToken(user);
  const { passwordHash, salt, ...profile } = user;
  res.json({ token, user: profile });
});
apiRouter.get("/auth/me", requireAuth, async (req, res) => {
  const user = await dal.getUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: "User profile not found." });
    return;
  }
  if (user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    user.role = "admin";
  }
  const { passwordHash, salt, ...profile } = user;
  res.json({ user: profile });
});
apiRouter.patch("/auth/profile", requireAuth, async (req, res) => {
  const { name, avatarUrl, homeDistrictId, bio } = req.body;
  try {
    const updated = await dal.updateUserProfile(req.user.userId, {
      name: typeof name === "string" ? name.trim() : void 0,
      avatarUrl: typeof avatarUrl === "string" ? avatarUrl : void 0,
      homeDistrictId: typeof homeDistrictId === "string" ? homeDistrictId : void 0,
      bio: typeof bio === "string" ? bio.trim() : void 0
    });
    res.json({ user: updated });
  } catch (err) {
    res.status(404).json({ error: err.message || "User not found." });
  }
});
async function handleAuthenticatedPasswordChange(req, res) {
  if (!req.user) {
    res.status(401).json({
      error: "Authentication required. Self-service unauthenticated password reset is disabled for security."
    });
    return;
  }
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    res.status(400).json({
      error: "Both current password and new password are required."
    });
    return;
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    res.status(400).json({
      error: "New password must be at least 6 characters long."
    });
    return;
  }
  const user = await dal.getUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: "User account not found." });
    return;
  }
  if (!verifyPassword(currentPassword, user.passwordHash, user.salt)) {
    res.status(401).json({ error: "Incorrect current password." });
    return;
  }
  const { hash, salt } = createPasswordRecord(newPassword);
  await dal.updateUserPassword(user.id, hash, salt);
  await dal.logAudit({
    action: "PASSWORD_CHANGED",
    entityType: "USER",
    entityId: user.id,
    userId: user.id,
    userName: user.name,
    details: "User successfully changed their account password via authenticated verification."
  });
  res.json({
    success: true,
    message: "Your password has been updated successfully."
  });
}
apiRouter.post("/auth/change-password", requireAuth, (req, res) => {
  handleAuthenticatedPasswordChange(req, res).catch((err) => {
    res.status(500).json({ error: err.message || "Internal server error." });
  });
});
apiRouter.post("/auth/reset-password", (req, res) => {
  if (!req.user) {
    res.status(403).json({
      error: "Self-service unauthenticated password reset is disabled for security. Please log in to change your password or contact an administrator."
    });
    return;
  }
  handleAuthenticatedPasswordChange(req, res).catch((err) => {
    res.status(500).json({ error: err.message || "Internal server error." });
  });
});
apiRouter.get("/divisions", async (_req, res) => {
  const divisions = await dal.getDivisions();
  res.json(divisions);
});
apiRouter.get("/districts", async (_req, res) => {
  const districts = await dal.getDistricts();
  res.json(districts);
});
apiRouter.get("/districts/:id", async (req, res) => {
  const district = await dal.getDistrictById(req.params.id);
  if (!district) {
    res.status(404).json({ error: "District not found." });
    return;
  }
  const divisions = await dal.getDivisions();
  const division = divisions.find((d) => d.id === district.divisionId);
  const districtFoods = await dal.getFoods({ districtId: district.id });
  res.json({
    district,
    division,
    foods: districtFoods
  });
});
apiRouter.get("/categories", async (_req, res) => {
  const categories = await dal.getCategories();
  res.json(categories);
});
apiRouter.get("/foods", async (req, res) => {
  const { division, district, category, search, dietary } = req.query;
  const foods = await dal.getFoods({
    divisionId: division && division !== "all" ? String(division) : void 0,
    districtId: district && district !== "all" ? String(district) : void 0,
    category: category && category !== "all" ? String(category) : void 0,
    dietary: dietary && dietary !== "all" ? String(dietary) : void 0,
    search: search ? String(search) : void 0,
    includeDrafts: false
  });
  res.json(foods);
});
apiRouter.get("/foods/:id", async (req, res) => {
  const food = await dal.getFoodById(req.params.id);
  if (!food || !food.isPublished && req.user?.role !== "admin") {
    res.status(404).json({ error: "Food delicacy not found." });
    return;
  }
  const district = await dal.getDistrictById(food.districtId);
  const divisions = await dal.getDivisions();
  const division = divisions.find((d) => d.id === food.divisionId);
  const reviews = await dal.getReviews(food.id);
  res.json({
    food,
    district,
    division,
    reviews
  });
});
apiRouter.post("/foods", requireAdmin, async (req, res) => {
  const {
    nameEn,
    nameBn,
    shortDescription,
    detailedDescription,
    category,
    districtId,
    divisionId,
    imageUrl,
    originHistory,
    originSource,
    isPublished,
    ingredients,
    approximatePriceBdt,
    dietaryType
  } = req.body;
  if (!nameBn || typeof nameBn !== "string" || !nameBn.trim()) {
    res.status(400).json({ error: "Bengali food name (\u09AC\u09BE\u0982\u09B2\u09BE \u09A8\u09BE\u09AE) is required." });
    return;
  }
  if (!nameEn || typeof nameEn !== "string" || !nameEn.trim()) {
    res.status(400).json({ error: "English food name is required." });
    return;
  }
  if (!districtId || typeof districtId !== "string") {
    res.status(400).json({ error: "District is required." });
    return;
  }
  const district = await dal.getDistrictById(districtId.trim());
  if (!district) {
    res.status(400).json({ error: "Invalid district ID." });
    return;
  }
  const effectiveDivisionId = district.divisionId;
  if (divisionId && divisionId !== effectiveDivisionId) {
    res.status(400).json({
      error: `District "${district.nameEn}" belongs to division "${district.divisionId}", not "${divisionId}".`
    });
    return;
  }
  const trimmedImageUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";
  let finalImageUrl = "";
  if (trimmedImageUrl) {
    if (!isValidFoodImageReference(trimmedImageUrl)) {
      res.status(400).json({ error: "Invalid food image URL format." });
      return;
    }
    finalImageUrl = normalizeFoodImageReference(trimmedImageUrl);
  }
  const cleanEn = nameEn.trim().toLowerCase();
  const cleanBn = nameBn.trim();
  const districtFoods = await dal.getFoods({ districtId: district.id, includeDrafts: true });
  const isDuplicate = districtFoods.some(
    (f) => f.districtId === district.id && (f.nameEn.toLowerCase() === cleanEn || f.nameBn.trim() === cleanBn)
  );
  if (isDuplicate) {
    res.status(409).json({
      error: `A food record named "${nameEn.trim()}" / "${nameBn.trim()}" already exists for district "${district.nameEn}".`
    });
    return;
  }
  const validCategories = [
    "main_course",
    "traditional",
    "street_food",
    "snacks",
    "dessert",
    "drinks",
    "sweets_pitha"
  ];
  const effectiveCategory = validCategories.includes(category) ? category : "traditional";
  const newFood = {
    id: "food_" + crypto4.randomUUID().slice(0, 8),
    nameEn: nameEn.trim(),
    nameBn: nameBn.trim(),
    shortDescription: (shortDescription || `${nameEn.trim()} (${nameBn.trim()}) from ${district.nameEn}`).trim(),
    detailedDescription: (detailedDescription || shortDescription || `${nameEn.trim()} (${nameBn.trim()}) is a regional culinary specialty of ${district.nameEn}, Bangladesh.`).trim(),
    category: effectiveCategory,
    districtId: district.id,
    divisionId: effectiveDivisionId,
    imageUrl: finalImageUrl || "",
    originHistory: (originHistory || "").trim(),
    originSource: (originSource || "").trim(),
    isPublished: isPublished !== false,
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    approximatePriceBdt: Number(approximatePriceBdt) || 0,
    dietaryType: ["non-veg", "veg", "sweet"].includes(dietaryType) ? dietaryType : "non-veg",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const createdFood = await dal.createFood(newFood);
  await dal.logAudit({
    action: "CREATE_FOOD",
    entityType: "FOOD",
    entityId: createdFood.id,
    userId: req.user.userId,
    userName: req.user.email,
    details: `Added new food: ${createdFood.nameEn} (${createdFood.nameBn}) in ${district.nameEn} [${createdFood.isPublished ? "Published" : "Draft"}]`
  });
  res.status(201).json(createdFood);
});
apiRouter.put("/foods/:id", requireAdmin, async (req, res) => {
  const existing = await dal.getFoodById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Food not found." });
    return;
  }
  const {
    nameEn,
    nameBn,
    shortDescription,
    detailedDescription,
    category,
    districtId,
    divisionId,
    imageUrl,
    originHistory,
    originSource,
    isPublished,
    ingredients,
    approximatePriceBdt,
    dietaryType
  } = req.body;
  if (nameBn !== void 0 && (!nameBn || typeof nameBn !== "string" || !nameBn.trim())) {
    res.status(400).json({ error: "Bengali food name (\u09AC\u09BE\u0982\u09B2\u09BE \u09A8\u09BE\u09AE) cannot be empty." });
    return;
  }
  if (nameEn !== void 0 && (!nameEn || typeof nameEn !== "string" || !nameEn.trim())) {
    res.status(400).json({ error: "English food name cannot be empty." });
    return;
  }
  let effectiveDistrictId = existing.districtId;
  let effectiveDivisionId = existing.divisionId;
  if (districtId) {
    const district = await dal.getDistrictById(districtId.trim());
    if (!district) {
      res.status(400).json({ error: "Invalid district ID." });
      return;
    }
    effectiveDistrictId = district.id;
    effectiveDivisionId = district.divisionId;
    if (divisionId && divisionId !== district.divisionId) {
      res.status(400).json({
        error: `District "${district.nameEn}" belongs to division "${district.divisionId}".`
      });
      return;
    }
  }
  let normalizedUpdatedImageUrl = void 0;
  if (imageUrl !== void 0 && typeof imageUrl === "string") {
    const trimmedImageUrl = imageUrl.trim();
    if (trimmedImageUrl) {
      if (!isValidFoodImageReference(trimmedImageUrl)) {
        res.status(400).json({ error: "Invalid food image URL format." });
        return;
      }
      normalizedUpdatedImageUrl = normalizeFoodImageReference(trimmedImageUrl);
    } else {
      normalizedUpdatedImageUrl = "";
    }
  }
  const finalEn = (nameEn ?? existing.nameEn).trim().toLowerCase();
  const finalBn = (nameBn ?? existing.nameBn).trim();
  const districtFoods = await dal.getFoods({ districtId: effectiveDistrictId, includeDrafts: true });
  const conflict = districtFoods.some(
    (f) => f.id !== existing.id && f.districtId === effectiveDistrictId && (f.nameEn.toLowerCase() === finalEn || f.nameBn.trim() === finalBn)
  );
  if (conflict) {
    res.status(409).json({
      error: `Another food record named "${finalEn}" / "${finalBn}" already exists for this district.`
    });
    return;
  }
  const updates = {
    ...nameEn !== void 0 ? { nameEn: nameEn.trim() } : {},
    ...nameBn !== void 0 ? { nameBn: nameBn.trim() } : {},
    ...shortDescription !== void 0 ? { shortDescription: shortDescription.trim() } : {},
    ...detailedDescription !== void 0 ? { detailedDescription: detailedDescription.trim() } : {},
    ...category !== void 0 ? { category } : {},
    districtId: effectiveDistrictId,
    divisionId: effectiveDivisionId,
    ...normalizedUpdatedImageUrl !== void 0 ? { imageUrl: normalizedUpdatedImageUrl } : {},
    ...originHistory !== void 0 ? { originHistory: originHistory.trim() } : {},
    ...originSource !== void 0 ? { originSource: originSource.trim() } : {},
    ...isPublished !== void 0 ? { isPublished: Boolean(isPublished) } : {},
    ...ingredients !== void 0 ? { ingredients: Array.isArray(ingredients) ? ingredients : [] } : {},
    ...approximatePriceBdt !== void 0 ? { approximatePriceBdt: Number(approximatePriceBdt) || 0 } : {},
    ...dietaryType !== void 0 ? { dietaryType } : {}
  };
  const updated = await dal.updateFood(existing.id, updates);
  await dal.logAudit({
    action: "UPDATE_FOOD",
    entityType: "FOOD",
    entityId: existing.id,
    userId: req.user.userId,
    userName: req.user.email,
    details: `Updated food: ${updated.nameEn} (${updated.nameBn}) [${updated.isPublished ? "Published" : "Draft"}]`
  });
  res.json(updated);
});
apiRouter.patch("/foods/:id/publish", requireAdmin, async (req, res) => {
  const existing = await dal.getFoodById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Food not found." });
    return;
  }
  const { isPublished } = req.body;
  const food = await dal.togglePublishFood(req.params.id, Boolean(isPublished));
  await dal.logAudit({
    action: food.isPublished ? "PUBLISH_FOOD" : "UNPUBLISH_FOOD",
    entityType: "FOOD",
    entityId: food.id,
    userId: req.user.userId,
    userName: req.user.email,
    details: `${food.isPublished ? "Published" : "Unpublished"} food: ${food.nameEn} (${food.nameBn})`
  });
  res.json(food);
});
apiRouter.delete("/foods/:id", requireAdmin, async (req, res) => {
  const food = await dal.getFoodById(req.params.id);
  if (!food) {
    res.status(404).json({ error: "Food not found." });
    return;
  }
  await dal.deleteFood(req.params.id);
  await dal.logAudit({
    action: "DELETE_FOOD",
    entityType: "FOOD",
    entityId: food.id,
    userId: req.user.userId,
    userName: req.user.email,
    details: `Deleted food: ${food.nameEn}`
  });
  res.json({ success: true, message: "Food item deleted successfully." });
});
var handleCreateSubmission = async (req, res) => {
  const {
    nameEn,
    nameBn,
    shortDescription,
    detailedDescription,
    category,
    districtId,
    imageUrl,
    originHistory,
    originSource,
    approximatePriceBdt,
    dietaryType,
    ingredients,
    accurateInfoConfirmed,
    confirmDuplicateOverride
  } = req.body;
  if (!nameBn || typeof nameBn !== "string" || !nameBn.trim()) {
    res.status(400).json({ error: "Bengali food name (\u09AC\u09BE\u0982\u09B2\u09BE \u09A8\u09BE\u09AE) is required." });
    return;
  }
  if (!nameEn || typeof nameEn !== "string" || !nameEn.trim()) {
    res.status(400).json({ error: "English food name is required." });
    return;
  }
  if (!districtId || typeof districtId !== "string") {
    res.status(400).json({ error: "District is required." });
    return;
  }
  const district = await dal.getDistrictById(districtId.trim());
  if (!district) {
    res.status(400).json({ error: "Invalid district ID selected." });
    return;
  }
  if (!shortDescription || typeof shortDescription !== "string" || !shortDescription.trim()) {
    res.status(400).json({ error: "Short description is required." });
    return;
  }
  if (!accurateInfoConfirmed) {
    res.status(400).json({
      error: "Please confirm that the submitted information is accurate to the best of your knowledge."
    });
    return;
  }
  const trimmedImageUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";
  let finalSubmissionImageUrl = "";
  if (trimmedImageUrl) {
    if (!isValidFoodImageReference(trimmedImageUrl)) {
      res.status(400).json({ error: "Invalid food image URL format." });
      return;
    }
    finalSubmissionImageUrl = normalizeFoodImageReference(trimmedImageUrl);
  }
  const cleanEn = nameEn.trim().toLowerCase();
  const cleanBn = nameBn.trim();
  const catalogFoods = await dal.getFoods({ districtId: district.id, includeDrafts: true });
  const existingCatalogMatch = catalogFoods.find(
    (f) => f.districtId === district.id && (f.nameEn.toLowerCase() === cleanEn || f.nameBn.trim() === cleanBn)
  );
  const pendingSubmissions = await dal.getSubmissions({ districtId: district.id, status: "pending" });
  const existingPendingMatch = pendingSubmissions.find(
    (s) => s.status === "pending" && s.districtId === district.id && (s.nameEn.toLowerCase() === cleanEn || s.nameBn.trim() === cleanBn)
  );
  if ((existingCatalogMatch || existingPendingMatch) && !confirmDuplicateOverride) {
    res.status(409).json({
      error: `A food named "${nameEn.trim()}" / "${nameBn.trim()}" already exists or has a pending submission in ${district.nameEn}.`,
      isDuplicate: true,
      existingCatalogId: existingCatalogMatch ? existingCatalogMatch.id : void 0,
      existingCatalogFood: existingCatalogMatch,
      existingPendingId: existingPendingMatch ? existingPendingMatch.id : void 0
    });
    return;
  }
  const validCategories = [
    "main_course",
    "traditional",
    "street_food",
    "snacks",
    "dessert",
    "drinks",
    "sweets_pitha"
  ];
  const effectiveCategory = validCategories.includes(category) ? category : "traditional";
  const submitterUser = await dal.getUserById(req.user.userId);
  const submitterName = submitterUser?.name || req.user.email.split("@")[0];
  const newSubmission = {
    id: "sub_" + crypto4.randomUUID().slice(0, 8),
    nameEn: nameEn.trim(),
    nameBn: nameBn.trim(),
    shortDescription: shortDescription.trim(),
    detailedDescription: (detailedDescription || shortDescription).trim(),
    category: effectiveCategory,
    districtId: district.id,
    divisionId: district.divisionId,
    imageUrl: finalSubmissionImageUrl || "",
    originHistory: (originHistory || "").trim(),
    originSource: (originSource || "").trim(),
    approximatePriceBdt: Number(approximatePriceBdt) || 0,
    dietaryType: ["non-veg", "veg", "sweet"].includes(dietaryType) ? dietaryType : "non-veg",
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    accurateInfoConfirmed: true,
    userId: req.user.userId,
    submitterName,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "pending",
    editHistory: []
  };
  const created = await dal.createSubmission(newSubmission);
  await dal.logAudit({
    action: "FOOD_SUBMITTED",
    entityType: "FOOD_SUBMISSION",
    entityId: created.id,
    userId: req.user.userId,
    userName: submitterName,
    details: `User submitted food suggestion: ${created.nameEn} (${created.nameBn}) for district ${district.nameEn} [Status: Pending]`
  });
  res.status(201).json({
    success: true,
    message: "Your regional food suggestion has been submitted successfully for verification!",
    referenceId: created.id,
    submission: created
  });
};
apiRouter.post("/submissions", requireAuth, (req, res) => {
  handleCreateSubmission(req, res).catch((err) => res.status(500).json({ error: err.message || "Submission failed." }));
});
apiRouter.post("/food-submissions", requireAuth, (req, res) => {
  handleCreateSubmission(req, res).catch((err) => res.status(500).json({ error: err.message || "Submission failed." }));
});
apiRouter.get("/user/submissions", requireAuth, async (req, res) => {
  const userSubmissions = await dal.getSubmissions({ userId: req.user.userId });
  res.json(userSubmissions);
});
apiRouter.get("/user/submissions/:id", requireAuth, async (req, res) => {
  const submission = await dal.getSubmissionById(req.params.id);
  if (!submission) {
    res.status(404).json({ error: "Food submission not found." });
    return;
  }
  if (submission.userId !== req.user.userId && req.user.role !== "admin") {
    res.status(403).json({ error: "Access denied. You can only view your own submissions." });
    return;
  }
  res.json(submission);
});
apiRouter.put("/user/submissions/:id", requireAuth, async (req, res) => {
  const submission = await dal.getSubmissionById(req.params.id);
  if (!submission) {
    res.status(404).json({ error: "Food submission not found." });
    return;
  }
  if (submission.userId !== req.user.userId && req.user.role !== "admin") {
    res.status(403).json({ error: "Access denied. You can only edit your own submissions." });
    return;
  }
  if (submission.status !== "pending") {
    res.status(400).json({
      error: `Cannot edit a submission that has already been ${submission.status}.`
    });
    return;
  }
  const {
    nameEn,
    nameBn,
    shortDescription,
    detailedDescription,
    category,
    districtId,
    imageUrl,
    originHistory,
    originSource,
    approximatePriceBdt,
    dietaryType,
    ingredients
  } = req.body;
  if (nameBn !== void 0 && (!nameBn || !nameBn.trim())) {
    res.status(400).json({ error: "Bengali food name cannot be empty." });
    return;
  }
  if (nameEn !== void 0 && (!nameEn || !nameEn.trim())) {
    res.status(400).json({ error: "English food name cannot be empty." });
    return;
  }
  let finalDistrictId = submission.districtId;
  let finalDivisionId = submission.divisionId;
  if (districtId) {
    const district = await dal.getDistrictById(districtId.trim());
    if (!district) {
      res.status(400).json({ error: "Invalid district ID." });
      return;
    }
    finalDistrictId = district.id;
    finalDivisionId = district.divisionId;
  }
  let normalizedSubImageUrl = void 0;
  if (imageUrl !== void 0) {
    const trimmedImageUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";
    if (trimmedImageUrl) {
      if (!isValidFoodImageReference(trimmedImageUrl)) {
        res.status(400).json({ error: "Invalid food image URL format." });
        return;
      }
      normalizedSubImageUrl = normalizeFoodImageReference(trimmedImageUrl);
    } else {
      normalizedSubImageUrl = "";
    }
  }
  const editHistory = submission.editHistory || [];
  editHistory.push({
    editedAt: (/* @__PURE__ */ new Date()).toISOString(),
    summary: req.user.role === "admin" ? "Administrator updated details" : "User updated submission details"
  });
  const updates = {
    districtId: finalDistrictId,
    divisionId: finalDivisionId,
    ...nameEn !== void 0 ? { nameEn: nameEn.trim() } : {},
    ...nameBn !== void 0 ? { nameBn: nameBn.trim() } : {},
    ...shortDescription !== void 0 ? { shortDescription: shortDescription.trim() } : {},
    ...detailedDescription !== void 0 ? { detailedDescription: detailedDescription.trim() } : {},
    ...category !== void 0 ? { category } : {},
    ...normalizedSubImageUrl !== void 0 ? { imageUrl: normalizedSubImageUrl } : {},
    ...originHistory !== void 0 ? { originHistory: originHistory.trim() } : {},
    ...originSource !== void 0 ? { originSource: originSource.trim() } : {},
    ...approximatePriceBdt !== void 0 ? { approximatePriceBdt: Number(approximatePriceBdt) || 0 } : {},
    ...dietaryType !== void 0 ? { dietaryType } : {},
    ...Array.isArray(ingredients) ? { ingredients } : {},
    editHistory
  };
  const updated = await dal.updateSubmission(submission.id, updates);
  await dal.logAudit({
    action: "FOOD_SUBMISSION_EDITED",
    entityType: "FOOD_SUBMISSION",
    entityId: updated.id,
    userId: req.user.userId,
    userName: req.user.email,
    details: `Updated food submission: ${updated.nameEn} (${updated.nameBn})`
  });
  res.json(updated);
});
apiRouter.get("/admin/submissions", requireAdmin, async (req, res) => {
  const { status, search, district, division } = req.query;
  let list = await dal.getSubmissions({
    status: status && status !== "all" ? String(status) : void 0,
    districtId: district && district !== "all" ? String(district) : void 0
  });
  if (division && typeof division === "string" && division !== "all") {
    list = list.filter((s) => s.divisionId === division);
  }
  if (search && typeof search === "string") {
    const term = search.toLowerCase().trim();
    list = list.filter(
      (s) => s.nameEn.toLowerCase().includes(term) || s.nameBn.toLowerCase().includes(term) || s.submitterName.toLowerCase().includes(term) || s.id.toLowerCase().includes(term)
    );
  }
  const allFoods = await dal.getFoods({ includeDrafts: true });
  const enriched = list.map((sub) => {
    const cleanEn = sub.nameEn.toLowerCase().trim();
    const cleanBn = sub.nameBn.trim();
    const potentialCatalogMatch = allFoods.find(
      (f) => f.districtId === sub.districtId && (f.nameEn.toLowerCase() === cleanEn || f.nameBn.trim() === cleanBn)
    );
    return {
      ...sub,
      potentialDuplicate: potentialCatalogMatch ? {
        id: potentialCatalogMatch.id,
        nameEn: potentialCatalogMatch.nameEn,
        nameBn: potentialCatalogMatch.nameBn,
        districtId: potentialCatalogMatch.districtId
      } : null
    };
  });
  res.json(enriched);
});
apiRouter.put("/admin/submissions/:id/review", requireAdmin, async (req, res) => {
  const sub = await dal.getSubmissionById(req.params.id);
  if (!sub) {
    res.status(404).json({ error: "Food submission not found." });
    return;
  }
  const { action, adminFeedback, correctedData, overrideReviewed } = req.body;
  if (!action || !["approve", "reject"].includes(action)) {
    res.status(400).json({ error: 'Valid review action ("approve" or "reject") is required.' });
    return;
  }
  if (sub.status !== "pending" && !overrideReviewed) {
    if (sub.status === "approved" && sub.approvedFoodId) {
      const existingApprovedFood = await dal.getFoodById(sub.approvedFoodId);
      res.json({
        success: true,
        message: "Submission was already approved.",
        submission: sub,
        food: existingApprovedFood
      });
      return;
    }
    res.status(400).json({
      error: `This submission has already been reviewed (${sub.status}) on ${sub.reviewedAt || "earlier date"}.`
    });
    return;
  }
  const adminUser = await dal.getUserById(req.user.userId);
  const adminDisplayName = adminUser?.name || "Foodie BD Admin";
  if (action === "approve") {
    const finalEn = (correctedData?.nameEn || sub.nameEn || "").trim();
    const finalBn = (correctedData?.nameBn || sub.nameBn || "").trim();
    const finalDistrictId = (correctedData?.districtId || sub.districtId || "").trim();
    const district = await dal.getDistrictById(finalDistrictId);
    if (!finalBn) {
      res.status(400).json({ error: "Bengali food name cannot be empty for approval." });
      return;
    }
    if (!finalEn) {
      res.status(400).json({ error: "English food name cannot be empty for approval." });
      return;
    }
    if (!district) {
      res.status(400).json({ error: "Valid district is required for approval." });
      return;
    }
    let catalogFood = null;
    if (sub.approvedFoodId) {
      catalogFood = await dal.getFoodById(sub.approvedFoodId);
    }
    if (!catalogFood) {
      const newFoodId = "food_" + crypto4.randomUUID().slice(0, 8);
      const newFoodItem = {
        id: newFoodId,
        nameEn: finalEn,
        nameBn: finalBn,
        shortDescription: (correctedData?.shortDescription || sub.shortDescription || `${finalEn} (${finalBn}) from ${district.nameEn}`).trim(),
        detailedDescription: (correctedData?.detailedDescription || sub.detailedDescription || sub.shortDescription || `${finalEn} is a traditional regional delicacy from ${district.nameEn}.`).trim(),
        category: correctedData?.category || sub.category || "traditional",
        districtId: district.id,
        divisionId: district.divisionId,
        imageUrl: (correctedData?.imageUrl !== void 0 ? correctedData.imageUrl : sub.imageUrl).trim(),
        originHistory: (correctedData?.originHistory || sub.originHistory || "").trim(),
        originSource: (correctedData?.originSource || sub.originSource || "").trim(),
        isPublished: true,
        // Approved food is immediately published in public catalog
        ingredients: Array.isArray(correctedData?.ingredients) ? correctedData.ingredients : sub.ingredients || [],
        approximatePriceBdt: Number(correctedData?.approximatePriceBdt !== void 0 ? correctedData.approximatePriceBdt : sub.approximatePriceBdt) || 0,
        dietaryType: correctedData?.dietaryType || sub.dietaryType || "non-veg",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        // Attribution & Community Verification
        submissionId: sub.id,
        submittedByUserId: sub.userId,
        submittedByUserName: sub.submitterName,
        approvedByUserId: req.user.userId,
        approvedByUserName: adminDisplayName,
        approvedAt: (/* @__PURE__ */ new Date()).toISOString(),
        verificationStatus: "verified"
      };
      catalogFood = await dal.createFood(newFoodItem);
    } else {
      catalogFood = await dal.updateFood(catalogFood.id, {
        nameEn: finalEn,
        nameBn: finalBn,
        districtId: district.id,
        divisionId: district.divisionId,
        isPublished: true
      });
    }
    const reviewedSub = await dal.reviewSubmission(sub.id, {
      status: "approved",
      reviewedByUserId: req.user.userId,
      reviewedByUserName: adminDisplayName,
      adminFeedback: (adminFeedback || "Approved and published to the Foodie BD regional culinary catalog.").trim(),
      approvedFoodId: catalogFood.id
    });
    await dal.logAudit({
      action: "FOOD_SUBMISSION_APPROVED",
      entityType: "FOOD_SUBMISSION",
      entityId: sub.id,
      userId: req.user.userId,
      userName: adminDisplayName,
      details: `Approved food suggestion "${catalogFood.nameEn}" (${catalogFood.nameBn}) by ${sub.submitterName}. Created catalog food ID: ${catalogFood.id}`
    });
    res.json({
      success: true,
      message: `Food submission "${sub.nameEn}" successfully approved and published!`,
      submission: reviewedSub,
      food: catalogFood
    });
    return;
  }
  if (action === "reject") {
    if (!adminFeedback || !adminFeedback.trim()) {
      res.status(400).json({ error: "Rejection feedback / reason is required for the user." });
      return;
    }
    const reviewedSub = await dal.reviewSubmission(sub.id, {
      status: "rejected",
      reviewedByUserId: req.user.userId,
      reviewedByUserName: adminDisplayName,
      adminFeedback: adminFeedback.trim()
    });
    await dal.logAudit({
      action: "FOOD_SUBMISSION_REJECTED",
      entityType: "FOOD_SUBMISSION",
      entityId: sub.id,
      userId: req.user.userId,
      userName: adminDisplayName,
      details: `Rejected food suggestion "${sub.nameEn}" (${sub.nameBn}) by ${sub.submitterName}. Reason: ${adminFeedback.trim()}`
    });
    res.json({
      success: true,
      message: `Food submission "${sub.nameEn}" was rejected.`,
      submission: reviewedSub
    });
    return;
  }
});
apiRouter.get("/user/journey", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const userTrackings = await dal.getUserFoods(userId);
  const allFoods = await dal.getFoods({ includeDrafts: true });
  const allDistricts = await dal.getDistricts();
  const allDivisions = await dal.getDivisions();
  const joined = userTrackings.map((t) => {
    const food = allFoods.find((f) => f.id === t.foodId);
    const district = food ? allDistricts.find((d) => d.id === food.districtId) : void 0;
    const division = food ? allDivisions.find((d) => d.id === food.divisionId) : void 0;
    return {
      ...t,
      food,
      district,
      division
    };
  });
  res.json(joined);
});
apiRouter.post("/user/journey", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const { foodId, status, triedAt, rating, notes, photoUrl } = req.body;
  if (!foodId || !status || !["tried", "want_to_try"].includes(status)) {
    res.status(400).json({ error: 'Valid foodId and status ("tried" or "want_to_try") are required.' });
    return;
  }
  const food = await dal.getFoodById(foodId);
  if (!food) {
    res.status(404).json({ error: "Food record not found." });
    return;
  }
  const tracking = {
    id: "uf_" + crypto4.randomUUID().slice(0, 8),
    userId,
    foodId,
    status,
    triedAt: status === "tried" ? triedAt || (/* @__PURE__ */ new Date()).toISOString() : void 0,
    rating: rating ? Number(rating) : void 0,
    notes: notes ? String(notes) : void 0,
    photoUrl: photoUrl ? String(photoUrl) : void 0,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const saved = await dal.upsertUserFood(tracking);
  res.json(saved);
});
apiRouter.delete("/user/journey/:foodId", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const { foodId } = req.params;
  await dal.deleteUserFood(userId, foodId);
  res.json({ success: true, message: "Removed from journey." });
});
apiRouter.get("/user/achievements", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const userTrackings = await dal.getUserFoods(userId);
  const triedTrackings = userTrackings.filter((uf) => uf.status === "tried");
  const allFoods = await dal.getFoods({ includeDrafts: true });
  const triedFoods = triedTrackings.map((t) => allFoods.find((f) => f.id === t.foodId)).filter((f) => !!f);
  const totalTried = triedFoods.length;
  const uniqueDistricts = new Set(triedFoods.map((f) => f.districtId)).size;
  const uniqueDivisions = new Set(triedFoods.map((f) => f.divisionId)).size;
  const sweetsCount = triedFoods.filter((f) => f.category === "sweets_pitha" || f.category === "dessert").length;
  const dhakaCount = triedFoods.filter((f) => f.divisionId === "dhaka").length;
  const spicyCount = triedFoods.filter(
    (f) => ["food_ctg_kala_bhuna", "food_khulna_chui_jhal", "food_coxsbazar_shutki", "food_rangpur_shidol"].includes(f.id)
  ).length;
  const achievements = await dal.getAchievements();
  const evaluated = achievements.map((ach) => {
    let currentVal = 0;
    if (ach.id === "first_bite") currentVal = totalTried;
    else if (ach.id === "sweet_tooth") currentVal = sweetsCount;
    else if (ach.id === "dhaka_foodie") currentVal = dhakaCount;
    else if (ach.id === "spice_chaser") currentVal = spicyCount;
    else if (ach.id === "five_districts") currentVal = uniqueDistricts;
    else if (ach.id === "ten_districts") currentVal = uniqueDistricts;
    else if (ach.id === "division_master") currentVal = uniqueDivisions;
    const isUnlocked = currentVal >= ach.threshold;
    return {
      ...ach,
      progress: Math.min(100, Math.round(currentVal / ach.threshold * 100)),
      isUnlocked
    };
  });
  res.json(evaluated);
});
apiRouter.get("/reviews", async (req, res) => {
  const { foodId } = req.query;
  const reviews = await dal.getReviews(foodId ? String(foodId) : void 0);
  res.json(reviews);
});
apiRouter.post("/reviews", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const { foodId, rating, comment } = req.body;
  if (!foodId || !rating || !comment || comment.trim().length < 3) {
    res.status(400).json({ error: "Valid foodId, rating (1-5), and comment are required." });
    return;
  }
  const user = await dal.getUserById(userId);
  const food = await dal.getFoodById(foodId);
  if (!user || !food) {
    res.status(404).json({ error: "User or food item not found." });
    return;
  }
  const review = {
    id: "rev_" + crypto4.randomUUID().slice(0, 8),
    userId,
    userName: user.name,
    userAvatar: user.avatarUrl,
    foodId,
    rating: Math.min(5, Math.max(1, Number(rating))),
    comment: comment.trim(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const created = await dal.createReview(review);
  res.status(201).json(created);
});
apiRouter.delete("/reviews/:id", requireAdmin, async (req, res) => {
  await dal.deleteReview(req.params.id);
  await dal.logAudit({
    action: "DELETE_REVIEW",
    entityType: "REVIEW",
    entityId: req.params.id,
    userId: req.user.userId,
    userName: req.user.email,
    details: `Moderated and removed review ID: ${req.params.id}`
  });
  res.json({ success: true, message: "Review removed by moderator." });
});
apiRouter.post("/reports", requireAuth, async (req, res) => {
  const { foodId, reason } = req.body;
  if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
    res.status(400).json({ error: "Please provide a descriptive reason for reporting (minimum 5 characters)." });
    return;
  }
  const report = await dal.createReport({
    id: "rep_" + crypto4.randomUUID().slice(0, 8),
    reporterUserId: req.user.userId,
    foodId: foodId ? String(foodId) : void 0,
    reason: reason.trim(),
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.status(201).json({ success: true, message: "Report submitted successfully.", report });
});
apiRouter.get("/admin/reports", requireAdmin, async (_req, res) => {
  const reports = await dal.getReports();
  res.json(reports);
});
apiRouter.patch("/admin/reports/:id", requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!status || !["reviewed", "dismissed"].includes(status)) {
    res.status(400).json({ error: 'Valid status ("reviewed" or "dismissed") is required.' });
    return;
  }
  try {
    const updated = await dal.updateReportStatus(req.params.id, status);
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err.message || "Report not found." });
  }
});
apiRouter.get("/stats", async (_req, res) => {
  const stats = await dal.getPlatformStats();
  res.json(stats);
});
apiRouter.get("/admin/foods", requireAdmin, async (req, res) => {
  const { division, district, category, search, status } = req.query;
  const foods = await dal.getFoods({
    divisionId: division && division !== "all" ? String(division) : void 0,
    districtId: district && district !== "all" ? String(district) : void 0,
    category: category && category !== "all" ? String(category) : void 0,
    search: search ? String(search) : void 0,
    includeDrafts: status !== "published"
  });
  let filtered = foods;
  if (status === "published") {
    filtered = foods.filter((f) => f.isPublished);
  } else if (status === "draft") {
    filtered = foods.filter((f) => !f.isPublished);
  }
  res.json(filtered);
});
apiRouter.get("/admin/overview", requireAdmin, async (_req, res) => {
  const overview = await dal.getAdminOverview();
  const recentAudits = await dal.getAuditLogs(15);
  res.json({
    ...overview,
    recentAudits
  });
});
apiRouter.get("/admin/users", requireAdmin, async (_req, res) => {
  const users = await dal.getAllUsers();
  res.json(users);
});
apiRouter.get("/admin/audit-logs", requireAdmin, async (_req, res) => {
  const logs = await dal.getAuditLogs(50);
  res.json(logs);
});
apiRouter.get("/admin/infra-status", requireAdmin, async (_req, res) => {
  const dbStatus = await testPostgresConnection();
  const storageStatus = await imageStorage.testStorageConnection();
  res.json({
    database: {
      isConnected: dbStatus.isConnected,
      provider: dbStatus.provider,
      database: dbStatus.database,
      error: dbStatus.error
    },
    storage: {
      isAvailable: storageStatus.isAvailable,
      provider: storageStatus.provider,
      bucket: storageStatus.bucket,
      error: storageStatus.error
    },
    activeDatabase: dbStatus.isConnected ? "postgresql" : dal.activeProvider
  });
});
apiRouter.get("/research/district/:districtId", async (req, res) => {
  const { districtId } = req.params;
  const entry = VERIFIED_DISTRICT_RESEARCH[districtId];
  if (!entry) {
    res.status(404).json({ error: `No research dossier found for district "${districtId}".` });
    return;
  }
  res.json(entry);
});
apiRouter.get("/research/dossiers", async (_req, res) => {
  const allFoods = await dal.getFoods({ includeDrafts: true });
  const allDistricts = await dal.getDistricts();
  const districtFoodMap = {};
  allFoods.forEach((f) => {
    if (!districtFoodMap[f.districtId]) districtFoodMap[f.districtId] = [];
    districtFoodMap[f.districtId].push(f);
  });
  const dossiers = Object.values(VERIFIED_DISTRICT_RESEARCH).map((r) => {
    const existing = districtFoodMap[r.districtId] || [];
    return {
      ...r,
      hasCatalogFood: existing.length > 0,
      existingCatalogFoodsCount: existing.length
    };
  });
  const totalDistricts = allDistricts.length;
  const representedDistricts = Object.keys(districtFoodMap).length;
  const unrepresentedDistricts = totalDistricts - representedDistricts;
  res.json({
    totalDistricts,
    representedDistricts,
    unrepresentedDistricts,
    dossiersCount: dossiers.length,
    dossiers
  });
});
apiRouter.get("/admin/research/district/:districtId", requireAdmin, async (req, res) => {
  const { districtId } = req.params;
  const entry = VERIFIED_DISTRICT_RESEARCH[districtId];
  if (!entry) {
    res.status(404).json({ error: `No research dossier found for district "${districtId}".` });
    return;
  }
  res.json(entry);
});
apiRouter.get("/admin/research/dossiers", requireAdmin, async (_req, res) => {
  const allFoods = await dal.getFoods({ includeDrafts: true });
  const allDistricts = await dal.getDistricts();
  const districtFoodMap = {};
  allFoods.forEach((f) => {
    if (!districtFoodMap[f.districtId]) districtFoodMap[f.districtId] = [];
    districtFoodMap[f.districtId].push(f);
  });
  const dossiers = Object.values(VERIFIED_DISTRICT_RESEARCH).map((r) => {
    const existing = districtFoodMap[r.districtId] || [];
    return {
      ...r,
      hasCatalogFood: existing.length > 0,
      existingCatalogFoodsCount: existing.length
    };
  });
  const totalDistricts = allDistricts.length;
  const representedDistricts = Object.keys(districtFoodMap).length;
  const unrepresentedDistricts = totalDistricts - representedDistricts;
  res.json({
    totalDistricts,
    representedDistricts,
    unrepresentedDistricts,
    dossiersCount: dossiers.length,
    dossiers
  });
});
apiRouter.post("/admin/research/publish-dossier", requireAdmin, async (req, res) => {
  const { districtId, customImageUrl, customPrice } = req.body;
  if (!districtId) {
    res.status(400).json({ error: "districtId is required." });
    return;
  }
  if (customImageUrl) {
    if (!isValidFoodImageReference(customImageUrl)) {
      res.status(400).json({ error: "Invalid food image URL format." });
      return;
    }
  }
  const dossier = VERIFIED_DISTRICT_RESEARCH[districtId];
  if (!dossier) {
    res.status(404).json({ error: `No verified research entry found for district "${districtId}".` });
    return;
  }
  const district = await dal.getDistrictById(districtId);
  if (!district) {
    res.status(404).json({ error: `District "${districtId}" not found in database.` });
    return;
  }
  const safeId = `food_${districtId}_${Date.now().toString(36)}`;
  const currentUser = req.user;
  const user = await dal.getUserById(currentUser.userId);
  const newFood = {
    id: safeId,
    nameEn: dossier.foodNameEn,
    nameBn: dossier.foodNameBn,
    shortDescription: dossier.shortDescriptionBn,
    detailedDescription: dossier.detailedDescriptionBn,
    category: dossier.category,
    districtId: dossier.districtId,
    divisionId: dossier.divisionId,
    imageUrl: customImageUrl ? normalizeFoodImageReference(customImageUrl) : "/placeholder-food.jpg",
    originHistory: dossier.historicalContextBn,
    originSource: dossier.primarySource,
    isPublished: true,
    ingredients: dossier.ingredients,
    approximatePriceBdt: customPrice !== void 0 ? Number(customPrice) : dossier.approximatePriceBdt,
    dietaryType: dossier.dietaryType,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    verificationStatus: "research_verified",
    researchStatus: dossier.researchStatus,
    citationSources: dossier.citationSources,
    imageCaption: dossier.imageSuggestionPrompt,
    imageAttribution: dossier.imageAttribution,
    imageVerified: Boolean(customImageUrl),
    approvedByUserId: currentUser.userId,
    approvedByUserName: user?.name || "Administrator",
    approvedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const createdFood = await dal.createFood(newFood);
  await dal.logAudit({
    action: "PUBLISH_RESEARCHED_FOOD",
    entityType: "FOOD",
    entityId: createdFood.id,
    userId: currentUser.userId,
    userName: user?.name || "Admin",
    details: `Published verified food research "${createdFood.nameEn}" (${createdFood.nameBn}) for district ${district.nameEn}. Source: ${dossier.primarySource}.`
  });
  res.status(201).json({
    success: true,
    message: `Successfully published verified food record for ${district.nameEn}.`,
    food: createdFood
  });
});
apiRouter.post("/setup/promote-admin", async (req, res) => {
  const configuredKey = process.env.ADMIN_SETUP_KEY;
  if (!configuredKey || typeof configuredKey !== "string" || configuredKey.trim().length < 16) {
    res.status(503).json({
      error: "Administrator setup endpoint is permanently disabled. Configure a secure ADMIN_SETUP_KEY (minimum 16 characters) in server environment."
    });
    return;
  }
  const hasExistingAdmin = await dal.hasAdmin();
  const { email } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (hasExistingAdmin) {
    const existingUser = await dal.getUserByEmail(normalizedEmail);
    if (!existingUser || existingUser.role !== "admin") {
      res.status(403).json({
        error: "Forbidden: Initial administrator bootstrap has already been completed. Role modifications must be performed by an authenticated administrator via the Admin Dashboard."
      });
      return;
    }
  }
  const setupKey = req.headers["x-admin-setup-key"] || req.body?.setupKey;
  if (!setupKey || typeof setupKey !== "string") {
    res.status(403).json({
      error: "Forbidden: Missing administrator setup authorization key."
    });
    return;
  }
  const setupKeyBuf = Buffer.from(setupKey.trim());
  const configuredKeyBuf = Buffer.from(configuredKey.trim());
  if (setupKeyBuf.length !== configuredKeyBuf.length || !crypto4.timingSafeEqual(setupKeyBuf, configuredKeyBuf)) {
    res.status(403).json({
      error: "Forbidden: Invalid administrator setup authorization key."
    });
    return;
  }
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    res.status(400).json({ error: "Valid email address is required." });
    return;
  }
  const user = await dal.getUserByEmail(normalizedEmail);
  if (!user) {
    res.status(404).json({
      error: `Account with email "${normalizedEmail}" was not found. Please register the account first in the app.`
    });
    return;
  }
  if (user.role === "admin") {
    const { passwordHash, salt, ...profile } = user;
    res.json({
      success: true,
      message: `Account "${user.email}" is already an authorized Administrator.`,
      user: profile
    });
    return;
  }
  const previousRole = user.role;
  const updatedProfile = await dal.updateUserRole(user.id, "admin");
  await dal.logAudit({
    action: "PROMOTE_TO_ADMIN",
    entityType: "USER",
    entityId: user.id,
    userId: user.id,
    userName: user.name,
    details: `Account ${user.email} was promoted to administrator role via initial bootstrap setup. Previous role was ${previousRole}.`
  });
  res.json({
    success: true,
    message: `Account "${user.email}" has been successfully promoted to the Admin role.`,
    user: updatedProfile
  });
});

// server/api.ts
try {
  validateAuthConfig();
} catch (err) {
  console.warn("\u26A0\uFE0F [AUTH NOTICE]:", err.message);
}
try {
  validateDatabaseConfig();
} catch (err) {
  console.warn("\u26A0\uFE0F [DATABASE NOTICE]:", err.message);
}
var app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use("/api", apiRouter);
app.use(apiRouter);
var api_default = app;
export {
  api_default as default
};
