
import React, { useState } from 'react';
import { Team } from '../types';

interface EditTeamModalProps {
  team: Team;
  onUpdate: (updatedData: any) => void;
  onCancel: () => void;
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({ team, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({ ...team });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Team</h2>
        {team.logo && (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-slate-600">
              <img src={team.logo} alt={`${team.name} logo`} className="w-full h-full object-cover" />
            </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Team Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-700 rounded-md p-2" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Team Logo URL</label>
            <input type="text" name="logo" value={formData.logo} onChange={handleChange} className="w-full bg-slate-700 rounded-md p-2" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Team Owner</label>
            <input type="text" name="owner" value={formData.owner} onChange={handleChange} className="w-full bg-slate-700 rounded-md p-2" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Purse</label>
            <input type="number" name="purse" value={formData.purse} onChange={handleChange} className="w-full bg-slate-700 rounded-md p-2" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Remaining Purse</label>
            <input type="number" name="remainingPurse" value={formData.remainingPurse} onChange={handleChange} className="w-full bg-slate-700 rounded-md p-2" />
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

export default EditTeamModal;
