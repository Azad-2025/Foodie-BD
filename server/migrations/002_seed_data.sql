-- ====================================================================
-- Foodie BD (খাদক ম্যাপ) Seed Data Migration 002
-- Description: Verified 8 divisions, 64 districts, categories & foods
-- ====================================================================

-- 1. Insert 8 Divisions
INSERT INTO divisions (id, name_en, name_bn, capital_en, capital_bn) VALUES
('dhaka', 'Dhaka', 'ঢাকা', 'Dhaka', 'ঢাকা'),
('chattogram', 'Chattogram', 'চট্টগ্রাম', 'Chattogram', 'চট্টগ্রাম'),
('rajshahi', 'Rajshahi', 'রাজশাহী', 'Rajshahi', 'রাজশাহী'),
('khulna', 'Khulna', 'খুলনা', 'Khulna', 'খুলনা'),
('barishal', 'Barishal', 'বরিশাল', 'Barishal', 'বরিশাল'),
('sylhet', 'Sylhet', 'সিলেট', 'Sylhet', 'সিলেট'),
('rangpur', 'Rangpur', 'রংপুর', 'Rangpur', 'রংপুর'),
('mymensingh', 'Mymensingh', 'ময়মনসিংহ', 'Mymensingh', 'ময়মনসিংহ')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Food Categories
INSERT INTO food_categories (id, name_en, name_bn, description) VALUES
('main_course', 'Main Course', 'প্রধান খাবার', 'Rich biryanis, mezban curries, and regional rice delicacies'),
('sweets_pitha', 'Sweets & Pitha', 'মিষ্টি ও পিঠা', 'Heritage mishti, curd, and seasonal handmade pithas'),
('traditional', 'Traditional Food', 'ঐতিহ্যবাহী খাবার', 'Century-old heritage recipes passed through generations'),
('street_food', 'Street Food', 'পথখাবার', 'Famous bazaar snacks, chotpoti, fuchka, and street kebabs'),
('snacks', 'Snacks & Bakes', 'নাস্তা ও বেকারি', 'Bakarkhani, savory chanachur, and evening tea companions'),
('dessert', 'Dessert', 'মিষ্টান্ন', 'Cooling puddings, kulfi, firni, and sweet curd'),
('drinks', 'Drinks & Beverages', 'পানীয়', 'Seven-color tea, matha, borhani, and fresh fruit sherbets')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert 64 Districts
INSERT INTO districts (id, division_id, name_en, name_bn, shape_name, lat, lng, prominent_dish_en, prominent_dish_bn, description) VALUES
-- Dhaka Division (13)
('dhaka', 'dhaka', 'Dhaka', 'ঢাকা', 'Dhaka', 23.8103, 90.4125, 'Kacchi Biryani & Bakarkhani', 'কাচ্চি বিরিয়ানি ও বাকরখানি', 'Capital city famed for Mughal culinary heritage in Old Dhaka.'),
('gazipur', 'dhaka', 'Gazipur', 'গাজীপুর', 'Gazipur', 24.0023, 90.4264, 'Kathal (Jackfruit) Delicacies', 'কাঁঠালের সুস্বাদু পদ', 'Known for prime national fruit jackfruit dishes.'),
('narayanganj', 'dhaka', 'Narayanganj', 'নারায়ণগঞ্জ', 'Narayanganj', 23.6238, 90.5000, 'Murabba & Sonargaon Sweets', 'মোরব্বা ও সোনারগাঁয়ের মিষ্টি', 'Historic ancient capital Sonargaon with rich fruit preserves.'),
('narsingdi', 'dhaka', 'Narsingdi', 'নরসিংদী', 'Narsingdi', 23.9322, 90.7154, 'Amriti & Sagar Kola', 'অমৃতি ও সাগর কলা', 'Renowned for aromatic Amriti sweets dipped in syrup.'),
('munshiganj', 'dhaka', 'Munshiganj', 'মুন্সীগঞ্জ', 'Munshiganj', 23.5422, 90.5305, 'Bhagyakul Mistanna & Aloor Dum', 'ভাগ্যকূলের মিষ্টান্ন ও আলুর দম', 'Home to Bikrampur royal dairy sweets.'),
('manikganj', 'dhaka', 'Manikganj', 'মানিকগঞ্জ', 'Manikganj', 23.8617, 90.0003, 'Jholir Gur Sandesh', 'ঝোলির গুড়ের সন্দেশ', 'Famous for organic date palm liquid jaggery.'),
('tangail', 'dhaka', 'Tangail', 'টাঙ্গাইল', 'Tangail', 24.2513, 89.9167, 'Porabari Chomchom', 'পোড়াবাড়ির চমচম', 'Birthplace of the celebrated Porabari Chomchom.'),
('kishoreganj', 'dhaka', 'Kishoreganj', 'কিশোরগঞ্জ', 'Kishoreganj', 24.4449, 90.7766, 'Balish Mishti & Haor Fish', 'বালিশ মিষ্টি ও হাওরের মাছ', 'Pillow-shaped jumbo sweets soaked in malai.'),
('faridpur', 'dhaka', 'Faridpur', 'ফরিদপুর', 'Faridpur', 23.6071, 89.8429, 'Khejur Gurer Payesh', 'খেজুর গুড়ের পায়েস', 'Famed date palm molasses used in winter rice pudding.'),
('gopalganj', 'dhaka', 'Gopalganj', 'গোপালগঞ্জ', 'Gopalganj', 23.0051, 89.8267, 'Rosogolla & Til-er Khaja', 'রসগোল্লা ও তিলের খাজা', 'Spongy pure cow-milk Rosogolla and crunchy sesame brittle.'),
('madaripur', 'dhaka', 'Madaripur', 'মাদারীপুর', 'Madaripur', 23.1641, 90.1897, 'Khejur Rosh Sweets', 'খেজুর রসের মিষ্টি', 'Artisan sweetmakers utilizing authentic date sap.'),
('rajbari', 'dhaka', 'Rajbari', 'রাজবাড়ী', 'Rajbari', 23.7574, 89.6445, 'Chamcham & Kheer Sandesh', 'চমচম ও ক্ষীর সন্দেশ', 'Historic Padma crossing famous for golden chamcham.'),
('shariatpur', 'dhaka', 'Shariatpur', 'শরীয়তপুর', 'Shariatpur', 23.2423, 90.4348, 'Bibikhana Pitha', 'বিবিখানা পিঠা', 'Baked rice-cake Bibikhana pitha made with jaggery.'),

-- Chattogram Division (11)
('chattogram', 'chattogram', 'Chattogram', 'চট্টগ্রাম', 'Chittagong', 22.3569, 91.7832, 'Mezban Gosht & Kala Bhuna', 'মেজবানি গোশত ও কালা ভুনা', 'Home to legendary spicy slow-roasted Kala Bhuna.'),
('coxs_bazar', 'chattogram', 'Cox''s Bazar', 'কক্সবাজার', 'Cox''s Bazar', 21.4272, 92.0058, 'Chhuri Shutki & Coral Fish', 'ছুরি শুঁটকি ভর্তা ও কোরাল মাছ', 'Sun-dried spicy ribbon fish and grilled coastal catch.'),
('cumilla', 'chattogram', 'Cumilla', 'কুমিল্লা', 'Comilla', 23.4607, 91.1809, 'Matri Bhander Rasmalai', 'মাতৃভাণ্ডারের রসমালাই', 'Iconic national home of authentic Rasmalai.'),
('brahmanbaria', 'chattogram', 'Brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 'Brahamanbaria', 23.9571, 91.1115, 'Chanar Mukhi', 'ছানার মুখী', 'GI-tagged sweet confection coated in sugar.'),
('chandpur', 'chattogram', 'Chandpur', 'চাঁদপুর', 'Chandpur', 23.2333, 90.6667, 'Padma-Meghna Ilish Paturi', 'পদ্মা-মেঘনার রূপালি ইলিশ পাতুরি', 'Premier national capital of Hilsa fish.'),
('feni', 'chattogram', 'Feni', 'ফেনী', 'Feni', 23.0159, 91.3976, 'Khondol-er Mishti', 'খন্দলের মিষ্টি', 'Historic sweet treats prepared in Khondol bazaar.'),
('lakshmipur', 'chattogram', 'Lakshmipur', 'লক্ষ্মীপুর', 'Lakshmipur', 22.9425, 90.8412, 'Moyish-er Doi', 'মহিষের দুধের দই', 'Dense, naturally set coastal buffalo milk curd.'),
('noakhali', 'chattogram', 'Noakhali', 'নোয়াখালী', 'Noakhali', 22.8696, 91.0991, 'Narikel Naru & Khola Jaal Pitha', 'নারকেল নাড়ু ও খোলাজা পিঠা', 'Paper-thin lacey egg crepe and coconut sweets.'),
('bandarban', 'chattogram', 'Bandarban', 'বান্দরবান', 'Bandarban', 22.1953, 92.2184, 'Bamboo Chicken & Mundi', 'বাঁশ মুরগি ও মুন্দি নুডুলস', 'Country chicken steamed inside green bamboo stalks.'),
('rangamati', 'chattogram', 'Rangamati', 'রাঙ্গামাটি', 'Rangamati', 22.7324, 92.2985, 'Hezon & Kaptai Lake Fish', 'হেজন ও কাপ্তাই লেকের তাজা মাছ', 'Delicacies cooked with bamboo shoot and lake fish.'),
('khagrachhari', 'chattogram', 'Khagrachhari', 'খাগড়াছড়ি', 'Khagrachhari', 23.1193, 91.9847, 'Pachon & Indigenous Herbs', 'পাজন তরকারি ও পাহাড়ি শাক', 'Festive dish made with 30 varieties of wild herbs.'),

-- Rajshahi Division (8)
('rajshahi', 'rajshahi', 'Rajshahi', 'রাজশাহী', 'Rajshahi', 24.3636, 88.6241, 'Kalai Ruti & Fazli Mango Delicacies', 'কালাই রুটি ও ফজলি আমের মিষ্টান্ন', 'Earthen-pan toasted black gram Kalai Ruti.'),
('bogura', 'rajshahi', 'Bogura', 'বগুড়া', 'Bogra', 24.8465, 89.3777, 'Bogurar Mishti Doi', 'বগুড়ার বিখ্যাত মিষ্টি দই', 'Internationally celebrated red-clay pottery sweet curd.'),
('pabna', 'rajshahi', 'Pabna', 'পাবনা', 'Pabna', 24.0044, 89.2372, 'Pabnar Peda & Ghee Sandesh', 'পাবনার প্যারা ও খাঁটি ঘিয়ের সন্দেশ', 'Dense melt-in-mouth milk Peda and pure ghee.'),
('sirajganj', 'rajshahi', 'Sirajganj', 'সিরাজগঞ্জ', 'Sirajganj', 24.4534, 89.7008, 'Sirajganj-er Ponir', 'সিরাজগঞ্জের খাঁটি পনির', 'Artisanal cow milk cheese wheel aged naturally.'),
('natore', 'rajshahi', 'Natore', 'নাটোর', 'Natore', 24.4206, 88.9324, 'Natorer Kachagolla', 'নাটোরের খাঁটি কাঁচাগোল্লা', 'Fresh un-cooked chhana infused with light sugar syrup.'),
('naogaon', 'rajshahi', 'Naogaon', 'নওগাঁ', 'Naogaon', 24.8108, 88.9416, 'Peda & Chhana Mishti', 'নওগাঁর প্যারা সন্দেশ', 'Condensed milk peda and aromatic Miniket rice.'),
('chapai_nawabganj', 'rajshahi', 'Chapai Nawabganj', 'চাঁপাইনবাবগঞ্জ', 'Nawabganj', 24.5965, 88.2775, 'Shibganj Chomchom & Mangoes', 'শিবগঞ্জের চমচম ও খিরসাপাত আম', 'The mango capital with golden Shibganj Chomchom.'),
('joypurhat', 'rajshahi', 'Joypurhat', 'জয়পুরহাট', 'Joypurhat', 25.1015, 89.0277, 'Bel-er Shorbot & Pitha', 'বেলের শরবত ও পিঠাপুলি', 'Wood-apple nectar and seasonal rural winter pithas.'),

-- Khulna Division (10)
('khulna', 'khulna', 'Khulna', 'খুলনা', 'Khulna', 22.8456, 89.5403, 'Chui Jhal Khasir Mangsho', 'চুইঝাল দিয়ে খাসির মাংস', 'Southern delicacy cooked with Piper chaba vine stem.'),
('bagerhat', 'khulna', 'Bagerhat', 'বাগেরহাট', 'Bagerhat', 22.6602, 89.7895, 'Sundarbans Honey & Mud Crab', 'সুন্দরবনের খাঁটি মধু ও কাঁকড়া ভুনা', 'Wild mangrove honey treats and spicy coastal mud crab.'),
('satkhira', 'khulna', 'Satkhira', 'সাতক্ষীরা', 'Satkhira', 22.7185, 89.0705, 'Satkhirar Sandesh & Golda Chingri', 'সাতক্ষীরার সন্দেশ ও গলদা চিংড়ি', 'Pure cow milk sandesh and freshwater jumbo prawns.'),
('jashore', 'khulna', 'Jashore', 'যশোর', 'Jessore', 23.1664, 89.2081, 'Jamtolar Mishti & Patali Gur', 'জামতলার মিষ্টি ও নলেন পাটালি গুড়', 'Home of date palm jaggery and century-old Jamtola sweets.'),
('jhenaidah', 'khulna', 'Jhenaidah', 'ঝিনাইদহ', 'Jhenaidah', 23.5450, 89.1726, 'Khejur Rosh Pitha & Sweets', 'খেজুর রসের পিঠা ও মিষ্টান্ন', 'Fresh date sap winter festivals and chhana creations.'),
('magura', 'khulna', 'Magura', 'মাগুরা', 'Magura', 23.4873, 89.4198, 'Batasa & Kadma', 'বাতাসা ও কদমা', 'Artisanal confectionery crafters making airy batasa.'),
('narail', 'khulna', 'Narail', 'নড়াইল', 'Narail', 23.1725, 89.5127, 'Chhit Ruti & Deshi Chitol', 'ছিট রুটি ও দেশি চিতল মাছ', 'River Chitra delicacies including Chhit Ruti and chitol.'),
('kushtia', 'khulna', 'Kushtia', 'কুষ্টিয়া', 'Kushtia', 23.9013, 89.1205, 'Tiler Khaja & Kulfi Malai', 'তিলের খাজা ও কুলফি মালাই', 'Paper-crisp sesame brittle and creamy pistachio Kulfi.'),
('chuadanga', 'khulna', 'Chuadanga', 'চুয়াডাঙ্গা', 'Chuadanga', 23.6402, 88.8418, 'Sarbhaja & Sarpuria', 'সরভাজা ও সরপুরিয়া', 'Layered milk-skin delicacies in saffron syrup.'),
('meherpur', 'khulna', 'Meherpur', 'মেহেরপুর', 'Meherpur', 23.7751, 88.6318, 'Sabitri & Roshkodom', 'সাবিত্রী ও রসকদম', 'Heritage dry sweet known for lasting weeks at room temperature.'),

-- Barishal Division (6)
('barishal', 'barishal', 'Barishal', 'বরিশাল', 'Barisal', 22.7010, 90.3535, 'Balam Rice & Ilish Bhapa', 'বালাম চালের ভাত ও ইলিশ ভাপা', 'Sweet aromatic Balam rice and steaming mustard Hilsa.'),
('bhola', 'barishal', 'Bhola', 'ভোলা', 'Bhola', 22.6859, 90.6481, 'Moyish-er Doodher Doi', 'মহিষের কাঁচা দুধের দই', 'Thick curd set naturally in wild hogla clay bowls.'),
('jhalokati', 'barishal', 'Jhalokati', 'ঝালকাঠি', 'Jhalokati', 22.6406, 90.1987, 'Guava & Chhana Sweets', 'ভাসমান বাজারের পেয়ারা ও ছানার মিষ্টি', 'Floating guava market delicacies and dairy sweets.'),
('pirojpur', 'barishal', 'Pirojpur', 'পিরোজপুর', 'Pirojpur', 22.5841, 89.9720, 'Amra Morobba & Pitha', 'আমড়া মোরব্বা ও বিভিন্ন পিঠা', 'Hog plum preserves and coconut-infused river delta pitha.'),
('barguna', 'barishal', 'Barguna', 'বরগুনা', 'Barguna', 22.1523, 90.1259, 'Chui Jhal River Fish', 'চুইঝালে নদীর টাটকা মাছ', 'Coastal river catches simmered in spicy Chui wood.'),
('patuakhali', 'barishal', 'Patuakhali', 'পটুয়াখালী', 'Patuakhali', 22.3596, 90.3299, 'Kuakata Seafood & Shutki Paturi', 'কুয়াকাটার সামুদ্রিক মাছ ও শুঁটকি পাতুরি', 'Roasted marine fish and banana-leaf wrapped dried fish.'),

-- Sylhet Division (4)
('sylhet', 'sylhet', 'Sylhet', 'সিলেট', 'Sylhet', 24.8949, 91.8687, 'Shatkora Beef & Nunor Pitha', 'সাতকড়া গরুর মাংস ও নুনর পিঠা', 'Wild citrus Shatkora beef curry and savory Nunor pitha.'),
('moulvibazar', 'sylhet', 'Moulvibazar', 'মৌলভীবাজার', 'Maulvibazar', 24.4829, 91.7774, 'Seven Color Tea & Manipuri Pitha', 'সাত রঙের চা ও মণিপুরি পিঠা', 'World-famous multi-layered Seven-Color Tea in Sreemangal.'),
('sunamganj', 'sylhet', 'Sunamganj', 'সুনামগঞ্জ', 'Sunamganj', 25.0658, 91.3950, 'Tanguar Haor Fresh Fish', 'টাঙ্গুয়ার হাওরের তাজা মাছের পদ', 'Wetland wild Boal, Pabda, and Rui fish curries.'),
('habiganj', 'sylhet', 'Habiganj', 'হবিগঞ্জ', 'Habiganj', 24.3749, 91.4155, 'Bipul-er Cha & Haor Duck Curry', 'বিপুলের চা ও হাওরের হাঁসের মাংস', 'Spiced tea blends and winter Haor duck curry with garlic.'),

-- Rangpur Division (8)
('rangpur', 'rangpur', 'Rangpur', 'রংপুর', 'Rangpur', 25.7439, 89.2752, 'Haribhanga Mango & Shidol', 'হাঁড়িভাঙা আম ও সিদল ভর্তা', 'Juicy Haribhanga mangoes and fermented fish Shidol.'),
('dinajpur', 'rangpur', 'Dinajpur', 'দিনাজপুর', 'Dinajpur', 25.6279, 88.6332, 'Kataribhog Rice & Litchi', 'কাটারিভোগ চালের পোলাও ও বেদানা লিচু', 'Aromatic Kataribhog grain and succulent sweet Bedana litchis.'),
('panchagarh', 'rangpur', 'Panchagarh', 'পঞ্চগড়', 'Panchagarh', 26.3411, 88.5541, 'Plainland Tea & Deshi Murgi', 'সমতলের চা ও দেশি হাঁস-মুরগি', 'Organic plainland teas and claypot poultry curries.'),
('thakurgaon', 'rangpur', 'Thakurgaon', 'ঠাকুরগাঁও', 'Thakurgaon', 26.0337, 88.4617, 'Shidol & Sura Pitha', 'সিদল ও সুরা পিঠা', 'Fiery crushed Shidol and tender steamed rice dumplings.'),
('gaibandha', 'rangpur', 'Gaibandha', 'গাইবান্ধা', 'Gaibandha', 25.3288, 89.5408, 'Rasmanjari', 'গাইবান্ধার রসমঞ্জরী', 'Mini golden chhana globes bathed in reduced cardamom malai.'),
('kurigram', 'rangpur', 'Kurigram', 'কুড়িগ্রাম', 'Kurigram', 25.8054, 89.6362, 'Kheer Chomchom & Char Fish', 'ক্ষীর চমচম ও চরের মাছ', 'Brahmaputra river delta thick milk skin sweets.'),
('lalmonirhat', 'rangpur', 'Lalmonirhat', 'লালমনিরহাট', 'Lalmonirhat', 25.9923, 89.2847, 'Shidol Vapa & Teesta Fish', 'সিদল ভাপা ও তিস্তার বৈরালী মাছ', 'Sparkling Bairali fish and steamed spicy Shidol.'),
('nilphamari', 'rangpur', 'Nilphamari', 'নীলফামারী', 'Nilphamari', 25.9318, 88.8560, 'Saidpur Beef Kebab & Petha', 'সৈয়দপুরের গরুর কাবাব ও পেঠা মিষ্টি', 'Spiced beef seekh kebabs and heritage ash-gourd sweets.'),

-- Mymensingh Division (4)
('mymensingh', 'mymensingh', 'Mymensingh', 'ময়মনসিংহ', 'Mymensingh', 24.7471, 90.4203, 'Muktagachar Monda', 'মুক্তাগাছার মণ্ডা', 'Two-century-old royal confection of pure chhana discs.'),
('jamalpur', 'mymensingh', 'Jamalpur', 'জামালপুর', 'Jamalpur', 24.9375, 89.9378, 'Milam Morobba & Pitha', 'মিলন মোরব্বা ও জামালপুরের পিঠা', 'Sweet preserves prepared with wax gourd and sugar.'),
('netrakona', 'mymensingh', 'Netrakona', 'নেত্রকোণা', 'Netrakona', 24.8709, 90.7279, 'Balish Mishti (Goyanath)', 'গয়ানাথের বালিশ মিষ্টি', 'Giant pillow-shaped sweets soaked in thick cream.'),
('sherpur', 'mymensingh', 'Sherpur', 'শেরপুর', 'Sherpur', 25.0205, 90.0153, 'Chhanar Payesh & Tiler Pitha', 'ছানার পায়েস ও তিলের পিঠা', 'Rich chhana payesh pudding and roasted sesame pithas.')
ON CONFLICT (id) DO NOTHING;
