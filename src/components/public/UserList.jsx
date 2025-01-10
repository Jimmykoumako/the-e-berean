// src/components/UserList.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
          .from('users') // Replace with your public.users table name
          .select('*'); // Fetch all columns

      if (error) {
        setError(error.message);
      } else {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
      <div>
        <h1>User List</h1>
        <ul>
          {users.map(user => (
              <li key={user.id}>
                {user.username} - {user.email}
              </li>
          ))}
        </ul>
      </div>
  );
};

export default UserList;