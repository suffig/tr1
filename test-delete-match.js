// Simple test script to validate deleteMatch functionality
import { deleteMatch } from './matches.js';

// Mock test function to check deleteMatch behavior
async function testDeleteMatch() {
    console.log('Testing deleteMatch function...');
    
    // Test case 1: Try to delete a non-existent match
    try {
        await deleteMatch(99999);
        console.log('✅ Non-existent match handled correctly');
    } catch (error) {
        console.log('❌ Error handling non-existent match:', error.message);
    }
    
    // Test case 2: Try to delete with invalid ID
    try {
        await deleteMatch(null);
        console.log('❌ Should have thrown error for null ID');
    } catch (error) {
        console.log('✅ Invalid ID handled correctly:', error.message);
    }
    
    try {
        await deleteMatch('invalid');
        console.log('❌ Should have thrown error for string ID');
    } catch (error) {
        console.log('✅ String ID handled correctly:', error.message);
    }
    
    console.log('Test completed');
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testDeleteMatch().catch(console.error);
}