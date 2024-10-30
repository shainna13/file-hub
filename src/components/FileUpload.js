"use client";
import { useState, useEffect } from 'react';
import JSZip from 'jszip'; // Import JSZip
import { supabase } from '@/lib/supabase';

const FileUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolderFiles, setCurrentFolderFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [currentFolder, setCurrentFolder] = useState(null);
  const [draggedFile, setDraggedFile] = useState(null);

  const fetchFolders = async () => {
    const { data, error } = await supabase.storage
      .from('file-transfer')
      .list('folders', { limit: 100 });

    if (error) {
      console.error("Error fetching folders:", error);
    } else {
      setFolders(data || []);
    }
  };

  const fetchUploadedFiles = async () => {
    const { data, error } = await supabase.storage
      .from('file-transfer')
      .list('files', { limit: 100 });

    if (error) {
      console.error("Error fetching uploaded files:", error);
    } else {
      setUploadedFiles(data || []);
    }
  };

  const fetchCurrentFolderFiles = async (folder) => {
    const { data, error } = await supabase.storage
      .from('file-transfer')
      .list(folder ? `folders/${folder}` : 'files', { limit: 100 });

    if (error) {
      console.error("Error fetching current folder files:", error);
    } else {
      setCurrentFolderFiles(data || []);
    }
  };

  useEffect(() => {
    fetchFolders();
    fetchUploadedFiles();
  }, []);

  useEffect(() => {
    if (currentFolder) {
      fetchCurrentFolderFiles(currentFolder);
    } else {
      setCurrentFolderFiles([]);
    }
  }, [currentFolder]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return alert("No files selected");

    const uploadedFileNames = [];

    for (const file of selectedFiles) {
      const filePath = currentFolder ? `folders/${currentFolder}/${file.name}` : `files/${file.name}`;

      const { error } = await supabase.storage
        .from('file-transfer')
        .upload(filePath, file);

      if (error) {
        console.error("Upload failed:", error.message);
        alert(`Upload failed: ${error.message}`);
        return;
      }

      uploadedFileNames.push({ name: file.name, path: filePath });
    }

    alert("Files uploaded successfully!");
    setSelectedFiles([]);
    setUploadedFiles((prevFiles) => [...prevFiles, ...uploadedFileNames]);
    fetchFolders();
    fetchCurrentFolderFiles(currentFolder);
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return alert("Folder name required");

    const folderPath = `folders/${folderName}/placeholder.txt`;
    const { error } = await supabase.storage
      .from('file-transfer')
      .upload(folderPath, new Blob(["placeholder"]));

    if (error) {
      console.error("Folder creation failed:", error);
      return;
    }

    alert("Folder created successfully!");
    setFolderName("");
    fetchFolders();
  };

  const handleFolderClick = (folder) => {
    setCurrentFolder(folder.name);
  };

  const handleDownload = async (fileName, folderName = null) => {
    try {
      const filePath = folderName ? `folders/${folderName}/${fileName}` : `files/${fileName}`;

      const { data, error } = await supabase.storage
        .from('file-transfer')
        .download(filePath);

      if (error) {
        console.error("Download failed:", error);
        alert(`Download failed: ${error.message}`);
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error during download:", error);
    }
  };

  const handleDownloadFolder = async (folderName) => {
    const zip = new JSZip();

    const { data: folderFiles, error } = await supabase.storage
      .from('file-transfer')
      .list(`folders/${folderName}`, { limit: 100 });

    if (error) {
      console.error("Error fetching folder files:", error);
      return;
    }

    for (const file of folderFiles) {
      const filePath = `folders/${folderName}/${file.name}`;

      const { data: fileData, error: fileError } = await supabase.storage
        .from('file-transfer')
        .download(filePath);

      if (fileError) {
        console.error("Error downloading file:", fileError);
        continue;
      }

      zip.file(file.name, fileData);
    }

    zip.generateAsync({ type: "blob" }).then((content) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    });
  };

  const handleDelete = async (filePath) => {
    const { error } = await supabase.storage
      .from('file-transfer')
      .remove([filePath]);

    if (error) {
      console.error("Error deleting file:", error);
      return;
    }

    alert("File deleted successfully!");
    setCurrentFolderFiles((prevFiles) => prevFiles.filter(file => file.name !== filePath.split('/').pop()));
  };

  const handleDeleteFolder = async (folderName) => {
    const { data: folderFiles, error } = await supabase.storage
      .from('file-transfer')
      .list(`folders/${folderName}`);

    if (error) {
      console.error("Error fetching folder files:", error);
      return;
    }

    const deletePromises = folderFiles.map(async (file) => {
      const filePath = `folders/${folderName}/${file.name}`;
      const { error } = await supabase.storage
        .from('file-transfer')
        .remove([filePath]);
      if (error) {
        console.error("Error deleting file:", error);
      }
    });

    await Promise.all(deletePromises);

    const { error: folderError } = await supabase.storage
      .from('file-transfer')
      .remove([`folders/${folderName}/placeholder.txt`]);

    if (folderError) {
      console.error("Error deleting folder placeholder:", folderError);
      return;
    }

    alert("Folder and its contents deleted successfully!");
    fetchFolders();
    fetchCurrentFolderFiles(currentFolder);
  };

  const handleDragStart = (file) => {
    setDraggedFile(file);
  };

  const handleFolderDrop = async (folderName) => {
    if (draggedFile) {
      const originalPath = `files/${draggedFile.name}`;
      const newPath = `folders/${folderName}/${draggedFile.name}`;

      const { error } = await supabase.storage
        .from('file-transfer')
        .move(originalPath, newPath);

      if (error) {
        console.error("Error moving file:", error);
        alert(`Error moving file: ${error.message}`);
      } else {
        alert(`File moved to ${folderName} successfully!`);
        fetchFolders();
        fetchCurrentFolderFiles(currentFolder);
      }
      setDraggedFile(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
  };

  return (
    <div>
                <h1 className="text-4xl font-bold text-center text-blue-600">File Hub</h1>
                <div className="flex flex-row space-x-4 max-w-6xl mx-auto p-6">
      <div className="flex flex-col w-1/3 border p-4 rounded-md bg-gray-100 h-fit overflow-y-auto">
        <h2 className="text-xl font-bold">Folders</h2>
        <input
          type="text"
          placeholder="Enter folder name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className="border rounded px-2 py-1 mt-2 mb-4"
        />
        <button onClick={handleCreateFolder} className="bg-blue-500 text-white px-4 py-2 rounded">Create Folder</button>
        <div className="mt-4">
          {folders.map((folder) => (
            <div
              key={folder.name}
              className="flex items-center justify-between border-b py-2 cursor-pointer"
              onClick={() => handleFolderClick(folder)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleFolderDrop(folder.name)}
            >
              <span>{folder.name}</span>
              <button onClick={() => handleDownloadFolder(folder.name)} className="ml-2 bg-green-500 text-white px-2 py-1 rounded">Download</button>
              <button onClick={() => handleDeleteFolder(folder.name)} className="ml-2 bg-red-500 text-white px-2 py-1 rounded">Delete</button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col w-1/3 border p-4 rounded-md bg-gray-100 h-fit overflow-y-auto">
        <h2 className="text-xl font-bold">Uploaded Files</h2>
        <input type="file" multiple onChange={handleFileChange} className="mt-4 mb-2" />
        <button onClick={handleUpload} className="bg-blue-500 text-white px-4 py-2 rounded">Upload Files</button>
        <div className="mt-4">
          {uploadedFiles.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between border-b py-2"
              draggable
              onDragStart={() => handleDragStart(file)}
            >
              <span>{file.name}</span>
              <button onClick={() => handleDownload(file.name)} className="ml-2 bg-green-500 text-white px-2 py-1 rounded">Download</button>
              <button onClick={() => handleDelete(`files/${file.name}`)} className="ml-2 bg-red-500 text-white px-2 py-1 rounded">Delete</button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col w-1/3 border p-4 rounded-md bg-gray-100 h-fit overflow-y-auto">
        <h2 className="text-xl font-bold">{currentFolder ? `Files in ${currentFolder}` : "Select a folder to view files"}</h2>
        <div className="mt-4">
          {currentFolderFiles.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between border-b py-2"
              draggable
              onDragStart={() => handleDragStart(file)}
            >
              <span>{file.name}</span>
              <button onClick={() => handleDownload(file.name, currentFolder)} className="ml-2 bg-green-500 text-white px-2 py-1 rounded">Download</button>
              <button onClick={() => handleDelete(`folders/${currentFolder}/${file.name}`)} className="ml-2 bg-red-500 text-white px-2 py-1 rounded">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>

    </div>
  );
};

export default FileUpload;
