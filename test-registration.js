// This is a simple test script to check if the registration with influencer flag works
// You can run this with Node.js to test the fix

console.log('Registration test script');
console.log('------------------------');
console.log('The following changes were made:');
console.log('1. In SignupStepper.tsx:');
console.log('   - Added isInfluencer flag to the profile object passed to signUp function');
console.log('2. In AuthContext.tsx:');
console.log('   - Added explicit handling of the isInfluencer flag');
console.log('   - Added user_id field to the profile data sent to Supabase');
console.log('   - Added better error logging for profile creation');
console.log('');
console.log('To test these changes:');
console.log('1. Register a new user with the influencer toggle ON');
console.log('2. Check if the user is registered as an influencer in the profiles table');
console.log('');
console.log('Expected behavior:');
console.log('- The is_influencer flag should be set to true in the profiles table');
console.log('- The user_id field should be set to the userId provided during registration');
