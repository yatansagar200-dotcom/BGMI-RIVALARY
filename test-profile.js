const axios = require('axios');

const testProfileUpdate = async () => {
  try {
    // First get contestants to find an ID
    const contestantsRes = await axios.get('http://localhost:5000/api/admin/contestants');
    console.log('Contestants:', contestantsRes.data);
    
    if (contestantsRes.data.data && contestantsRes.data.data.length > 0) {
      const id = contestantsRes.data.data[0]._id;
      console.log('Testing with ID:', id);
      
      const updateRes = await axios.put(`http://localhost:5000/api/contestants/profile/${id}`, {
        playerName: 'Updated Player',
        bgmiId: '1234567890',
        bio: 'Test bio updated'
      });
      console.log('Update response:', updateRes.data);
    } else {
      console.log('No contestants found');
    }
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
};

testProfileUpdate();
