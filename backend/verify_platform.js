const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock environmental settings
process.env.JWT_SECRET = 'test_secret_12345';
process.env.JWT_REFRESH_SECRET = 'test_refresh_12345';

console.log('--- STARTING PLATFORM SANITY VERIFICATION ---');

// 1. Test Password Hashing and Comparison
const testCryptography = async () => {
  try {
    console.log('\n1. Testing Cryptography & Password Hashing...');
    const originalPassword = 'securePassword123';
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(originalPassword, salt);
    console.log('   - Password successfully hashed:', hash.slice(0, 25) + '...');
    
    // Match password
    const isMatch = await bcrypt.compare(originalPassword, hash);
    const isNotMatch = await bcrypt.compare('wrongPassword', hash);
    
    if (isMatch && !isNotMatch) {
      console.log('   ✅ Cryptography checks passed successfully!');
      return true;
    } else {
      console.error('   ❌ Cryptography checks failed. Match evaluation mismatch.');
      return false;
    }
  } catch (err) {
    console.error('   ❌ Cryptography test encountered error:', err.message);
    return false;
  }
};

// 2. Test JWT Signing and Verification
const testJWT = () => {
  try {
    console.log('\n2. Testing JWT Access/Refresh Token Handshakes...');
    const userId = '507f1f77bcf86cd799439011'; // Mock MongoDB ObjectId
    
    // Sign tokens
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    console.log('   - Tokens generated.');
    
    // Verify tokens
    const accessDecoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    const refreshDecoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    if (accessDecoded.id === userId && refreshDecoded.id === userId) {
      console.log('   ✅ JWT authentication checks passed successfully!');
      return true;
    } else {
      console.error('   ❌ JWT verification failed. Payload ID mismatch.');
      return false;
    }
  } catch (err) {
    console.error('   ❌ JWT test encountered error:', err.message);
    return false;
  }
};

// 3. Test OTP Logic
const testOTP = () => {
  try {
    console.log('\n3. Testing One-Time Password Generation...');
    const { generateOTP, getOTPExpiry } = require('./utils/otp');
    
    const code = generateOTP();
    const expiry = getOTPExpiry();
    
    console.log(`   - Generated OTP: ${code}`);
    console.log(`   - Expiry set for: ${expiry.toISOString()}`);
    
    if (code.length === 6 && /^\d+$/.test(code) && expiry > new Date()) {
      console.log('   ✅ OTP validation checks passed successfully!');
      return true;
    } else {
      console.error('   ❌ OTP verification failed. Output attributes are invalid.');
      return false;
    }
  } catch (err) {
    console.error('   ❌ OTP test encountered error:', err.message);
    return false;
  }
};

// 4. Test Mock Fallback AI Engine
const testAIEngine = async () => {
  try {
    console.log('\n4. Testing AI Fallback Engine question selection...');
    const { generateAIQuestion, analyzePerformance } = require('./services/aiService');
    
    // Test basic question generation
    const question = await generateAIQuestion('Basic', []);
    console.log('   - Generated question sample:');
    console.log(`     * Topic: ${question.topic}`);
    console.log(`     * Q: ${question.questionText}`);
    console.log(`     * Options: A) ${question.options.A}, B) ${question.options.B}`);
    
    // Check parameters
    if (question.questionText && question.options.A && question.correctOption && question.explanation) {
      console.log('   ✅ AI Fallback engine checks passed!');
      return true;
    } else {
      console.error('   ❌ AI Fallback checks failed. Mismatched attributes.');
      return false;
    }
  } catch (err) {
    console.error('   ❌ AI Engine test encountered error:', err.message);
    return false;
  }
};

// Run all tests
const runAllTests = async () => {
  let allPassed = true;
  
  if (!(await testCryptography())) allPassed = false;
  if (!testJWT()) allPassed = false;
  if (!testOTP()) allPassed = false;
  if (!(await testAIEngine())) allPassed = false;
  
  console.log('\n--- VERIFICATION COMPLETE ---');
  if (allPassed) {
    console.log('🌟 SUCCESS: All code compilation and logic units validated!');
    process.exit(0);
  } else {
    console.error('🚨 FAILURE: Some units did not validate successfully.');
    process.exit(1);
  }
};

runAllTests();
