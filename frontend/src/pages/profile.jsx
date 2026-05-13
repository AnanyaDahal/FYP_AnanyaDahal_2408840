import React, { useState, useEffect } from "react";
import { buildApiUrl, getAuthHeaders } from "../config/api";
import { User, Lock, Upload, X, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Profile Information State
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    avatar: null,
  });
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileChanged, setProfileChanged] = useState(false);

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    letter: false,
    number: false,
    special: false,
    match: false,
  });

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Validate password requirements
  useEffect(() => {
    const newPwd = passwordData.newPassword;
    setPasswordValidation({
      length: newPwd.length >= 8,
      letter: /[A-Za-z]/.test(newPwd),
      number: /\d/.test(newPwd),
      special: /[@$!%*?&.\-_+#=]/.test(newPwd),
      match: newPwd === passwordData.confirmPassword && newPwd.length > 0,
    });
  }, [passwordData.newPassword, passwordData.confirmPassword]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl("/api/auth/profile"), {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setUser(data.user);
      setProfileData({
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar,
      });
      setProfilePreview(data.user.avatar);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load profile");
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setProfileData({
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar || null,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    setProfileChanged(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({ ...prev, avatar: reader.result }));
        setProfilePreview(reader.result);
        setProfileChanged(true);
        setError("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setProfileData((prev) => ({ ...prev, avatar: null }));
    setProfilePreview(null);
    setProfileChanged(true);
  };

  const handleSaveProfile = async () => {
    if (!profileData.name.trim() || !profileData.email.trim()) {
      setError("Name and email are required");
      return;
    }

    // Basic email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(profileData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setSaving(true);
      setError("");

      // Update profile information
      const updateResponse = await fetch(buildApiUrl("/api/auth/profile/update"), {
        method: "PUT",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
        }),
      });

      if (!updateResponse.ok) {
        const data = await updateResponse.json();
        throw new Error(data.message || "Failed to update profile");
      }

      const updatedUser = await updateResponse.json();

      // Update avatar if changed
      if (
        profileData.avatar &&
        profileData.avatar !== user.avatar
      ) {
        const avatarResponse = await fetch(
          buildApiUrl("/api/auth/profile/avatar"),
          {
            method: "PUT",
            headers: getAuthHeaders({
              "Content-Type": "application/json",
            }),
            body: JSON.stringify({
              avatar: profileData.avatar,
            }),
          }
        );

        if (!avatarResponse.ok) {
          const data = await avatarResponse.json();
          throw new Error(data.message || "Failed to update avatar");
        }
      } else if (profileData.avatar === null && user.avatar !== null) {
        // Remove avatar if it was deleted
        const removeResponse = await fetch(
          buildApiUrl("/api/auth/profile/avatar"),
          {
            method: "DELETE",
            headers: getAuthHeaders(),
          }
        );

        if (!removeResponse.ok) {
          const data = await removeResponse.json();
          throw new Error(data.message || "Failed to remove avatar");
        }
      }

      // Update local storage and state
      const finalUser = {
        ...updatedUser.user,
        avatar: profileData.avatar,
      };
      setUser(finalUser);
      localStorage.setItem("user", JSON.stringify(finalUser));
      window.dispatchEvent(new Event("userProfileUpdated"));
      setProfileChanged(false);

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (
      !passwordData.oldPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setError("All password fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    // Validate password complexity
    if (!Object.values(passwordValidation).slice(0, 4).every(Boolean)) {
      setError("New password does not meet complexity requirements");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        buildApiUrl("/api/auth/profile/password"),
        {
          method: "PUT",
          headers: getAuthHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            oldPassword: passwordData.oldPassword,
            newPassword: passwordData.newPassword,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to change password");
      }

      setSuccessMessage("Password changed successfully!");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">
            My Profile
          </h1>
          <p className="text-gray-400">
            Manage your account settings and security
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500 text-red-300 flex gap-3">
            <AlertCircle className="flex-shrink-0" size={20} />
            <p>{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500 text-green-300 flex gap-3">
            <CheckCircle className="flex-shrink-0" size={20} />
            <p>{successMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Profile Picture & Basic Info */}
          <div className="space-y-6">
            {/* Profile Picture Section */}
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <User size={20} className="text-cyan-400" />
                Profile Picture
              </h2>

              {/* Avatar Preview */}
              <div className="mb-4">
                {profilePreview ? (
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <img
                      src={profilePreview}
                      alt="Profile"
                      className="w-full h-full rounded-lg object-cover border-2 border-cyan-500"
                    />
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 mx-auto mb-4 rounded-lg bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
                    <User size={48} className="text-gray-500" />
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cyan-500/20 border border-cyan-500 text-cyan-400 hover:bg-cyan-500/30 cursor-pointer transition-colors">
                <Upload size={18} />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">
                Max file size: 5MB. Accepted formats: JPG, PNG, GIF
              </p>
            </div>

            {/* Basic Information Section */}
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
              <h2 className="text-xl font-bold mb-4">Basic Information</h2>

              {/* Full Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="Enter your email address"
                />
              </div>

              {/* User Role Badge */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account Type
                </label>
                <div className="inline-block px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500 text-cyan-400 font-medium">
                  {user?.role === "admin" ? "Administrator" : "User"}
                </div>
              </div>

              {/* Save Changes Button */}
              <button
                onClick={handleSaveProfile}
                disabled={!profileChanged || saving}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                  profileChanged
                    ? "bg-cyan-500 hover:bg-cyan-600 text-black"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                } ${saving ? "opacity-50" : ""}`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Right Column - Password Change */}
          <div>
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 h-full">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Lock size={20} className="text-cyan-400" />
                Change Password
              </h2>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                {/* Old Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.old ? "text" : "password"}
                      value={passwordData.oldPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          oldPassword: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 pr-10 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          old: !prev.old,
                        }))
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPasswords.old ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 pr-10 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPasswords.new ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 pr-10 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                {passwordData.newPassword && (
                  <div className="mt-4 p-4 rounded-lg bg-gray-900 border border-gray-700">
                    <p className="text-sm font-medium text-gray-300 mb-3">
                      Password Requirements:
                    </p>
                    <ul className="space-y-2">
                      <li
                        className={`text-xs flex items-center gap-2 ${
                          passwordValidation.length
                            ? "text-green-400"
                            : "text-gray-500"
                        }`}
                      >
                        <span className="font-bold">
                          {passwordValidation.length ? "✓" : "○"}
                        </span>
                        At least 8 characters
                      </li>
                      <li
                        className={`text-xs flex items-center gap-2 ${
                          passwordValidation.letter
                            ? "text-green-400"
                            : "text-gray-500"
                        }`}
                      >
                        <span className="font-bold">
                          {passwordValidation.letter ? "✓" : "○"}
                        </span>
                        At least 1 letter (A-Z, a-z)
                      </li>
                      <li
                        className={`text-xs flex items-center gap-2 ${
                          passwordValidation.number
                            ? "text-green-400"
                            : "text-gray-500"
                        }`}
                      >
                        <span className="font-bold">
                          {passwordValidation.number ? "✓" : "○"}
                        </span>
                        At least 1 number (0-9)
                      </li>
                      <li
                        className={`text-xs flex items-center gap-2 ${
                          passwordValidation.special
                            ? "text-green-400"
                            : "text-gray-500"
                        }`}
                      >
                        <span className="font-bold">
                          {passwordValidation.special ? "✓" : "○"}
                        </span>
                        At least 1 special character (@$!%*?&.-_+#=)
                      </li>
                      <li
                        className={`text-xs flex items-center gap-2 ${
                          passwordValidation.match
                            ? "text-green-400"
                            : "text-gray-500"
                        }`}
                      >
                        <span className="font-bold">
                          {passwordValidation.match ? "✓" : "○"}
                        </span>
                        Passwords match
                      </li>
                    </ul>
                  </div>
                )}

                {/* Change Password Button */}
                <button
                  type="submit"
                  disabled={
                    !Object.values(passwordValidation).every(Boolean) || saving
                  }
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-all mt-6 ${
                    Object.values(passwordValidation).every(Boolean)
                      ? "bg-cyan-500 hover:bg-cyan-600 text-black"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  } ${saving ? "opacity-50" : ""}`}
                >
                  {saving ? "Changing Password..." : "Change Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
