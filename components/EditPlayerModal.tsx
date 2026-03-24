
import React, { useState } from 'react';
import { Player, Category, Team } from '../types';
import { useAuction } from '../context/AuctionContext';

interface EditPlayerModalProps {
  player: Player;
  onUpdate: (updatedData: any) => void;
  onCancel: () => void;
  categories: Category[];
  teams: Team[];
}

const EditPlayerModal: React.FC<EditPlayerModalProps> = ({ player, onUpdate, onCancel, categories, teams }) => {
  const [formData, setFormData] = useState({ ...player });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { uploadImage } = useAuction();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, soldToTeamId: value || null }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    
    e.preventDefault();
    let updatedData = { ...formData };
    if (imageFile) {
      try {
        const imageUrl = await uploadImage(imageFile);
        updatedData = { ...updatedData, imageUrl };
      } catch (error) {
        console.error(`Image - ${imageFile} upload failed:`, error);
        alert("Image upload failed. Player will be added without an image.");
      }  
    }
    onUpdate(updatedData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Player</h2>
        {formData.imageUrl && (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-slate-600">
              <img src={formData.imageUrl} alt={`${formData.name}`} className="w-full h-full object-cover" />
            </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Player Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-700 rounded-md p-2" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Upload Image</label>
            <input type="file" onChange={handleImageChange} className="w-full bg-slate-700 rounded-md p-2" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Category</label>
            <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full bg-slate-700 rounded-md p-2">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Team</label>
            <select name="soldToTeamId" value={formData.soldToTeamId || ''} onChange={handleTeamChange} className="w-full bg-slate-700 rounded-md p-2">
              <option value="">Unsold</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Sold Price</label>
            <input type="number" name="soldPrice" value={formData.soldPrice} onChange={handleChange} className="w-full bg-slate-700 rounded-md p-2" />
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-slate-600">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-blue-600">Update</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlayerModal;
