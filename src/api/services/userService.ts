import apiClient from '../apiClient';
import { API_STRUCTURE } from '../api-structure.generated';
import { 
  User, 
  UserSchema,
  UpdateProfileRequest,
  UpdateProfileRequestSchema,
  ChangePasswordRequest,
  ChangePasswordRequestSchema
} from '../types';

/**
 * User Service
 * Handles all user-related API interactions
 */
class UserService {
  /**
   * Get current user's profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<{ user: User }>(
      API_STRUCTURE.user.profile.path
    );
    
    // Parse response with Zod for type safety
    const user = UserSchema.parse(response.data.user);
    
    return user;
  }
  
  /**
   * Update user profile
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    // Validate request data with Zod
    const validatedData = UpdateProfileRequestSchema.parse(profileData);
    
    const response = await apiClient.put<{ user: User }>(
      API_STRUCTURE.user.updateProfile.path,
      validatedData
    );
    
    // Parse response with Zod for type safety
    const user = UserSchema.parse(response.data.user);
    
    return user;
  }
  
  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    // Validate request data with Zod
    const validatedData = ChangePasswordRequestSchema.parse(passwordData);
    
    await apiClient.put(
      API_STRUCTURE.user.changePassword.path,
      validatedData
    );
  }
}

// Create and export a single instance
const userService = new UserService();
export default userService; 