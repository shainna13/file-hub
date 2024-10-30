// pages/upload/[id].js
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const DownloadPage = () => {
  const params = useParams();
  const { id } = params; // Get the dynamic id from URL

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch folders and files from Supabase
  const fetchItems = async () => {
    if (!id) return;

    const { data: folderData, error: folderError } = await supabase.storage
      .from('file-transfer')
      .list(`files/${id}`, { limit: 100 });

    if (folderError) {
      console.error('Error fetching folders:', folderError);
      setFolders([]);
    } else {
      setFolders(folderData.filter(item => item.metadata === null)); // filter for folders
      setFiles(folderData.filter(item => item.metadata)); // filter for files
    }

    setLoading(false); // Set loading to false in all cases
  };

  // Fetch items on component mount
  useEffect(() => {
    fetchItems();
  }, [id]);

  const getDownloadLink = async (fileName) => {
    const { data, error } = await supabase.storage
      .from('file-transfer')
      .getPublicUrl(`files/${id}/${fileName}`);

    if (error) {
      console.error('Error generating download link:', error);
      return '';
    }
    return data.publicUrl; // Return the public URL for downloading
  };

  const createFolder = async (folderName) => {
    const { error } = await supabase.storage
      .from('file-transfer')
      .upload(`files/${id}/${folderName}/.keep`, new Blob([]), { upsert: false });

    if (error) {
      console.error('Error creating folder:', error);
    } else {
      fetchItems();
    }
  };

  const deleteItem = async (itemName) => {
    const { error } = await supabase.storage
      .from('file-transfer')
      .remove([`files/${id}/${itemName}`]);

    if (error) {
      console.error('Error deleting item:', error);
    } else {
      fetchItems();
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold text-center">Files for Upload ID: {id}</h1>

      <div className="mt-4">
        <input
          type="text"
          placeholder="Enter folder name"
          onKeyDown={(e) => e.key === 'Enter' && createFolder(e.target.value)}
          className="border rounded p-2 mr-2"
        />
        <button
          onClick={() => createFolder(document.querySelector('input').value)}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Create Folder
        </button>
      </div>

      {loading ? (
        <p className="text-center mt-4">Loading files...</p>
      ) : (
        <>
          {folders.length > 0 && (
            <div>
              <h2 className="mt-6 text-xl font-semibold">Folders</h2>
              <ul className="space-y-4">
                {folders.map((folder) => (
                  <li key={folder.name} className="flex justify-between items-center">
                    <span className="text-lg">{folder.name}</span>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded-lg"
                      onClick={() => deleteItem(folder.name)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {files.length > 0 && (
            <div>
              <h2 className="mt-6 text-xl font-semibold">Files</h2>
              <ul className="space-y-4">
                {files.map((file) => (
                  <li key={file.name} className="flex justify-between items-center">
                    <span className="text-lg">{file.name}</span>
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      onClick={async () => {
                        const downloadLink = await getDownloadLink(file.name);
                        window.open(downloadLink, '_blank');
                      }}
                    >
                      Download
                    </button>
                    <button
                      className="ml-2 bg-red-500 text-white px-3 py-1 rounded-lg"
                      onClick={() => deleteItem(file.name)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DownloadPage;
