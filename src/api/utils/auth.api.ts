register: async (userData: {
    fullName: string;
    phone: string;
    password: string;
    dateOfBirth: string;
    email?: string;
  }): Promise<ApiHandlerResponse<AuthResponse>> => {
    try {
      const response = await apiClient.post(API_ROUTES.REGISTER, userData);
      
      // Extract token using the utility function that handles different formats
      const token = extractUserToken(response.data);
      
      // Extract user data which might be in different locations
      const userResponse = response.data?.user || 
                          response.data?.data?.user || 
                          (response.data?.data && !response.data.data.user ? response.data.data : null);
      
      // Check if the response indicates success even without token or user data
      // This is critical for handling backend responses that don't match frontend expectations
      if (response.data?.success === true) {
        // If the backend says success but we're missing data, try to extract what we can
        const partialUser = {
          id: userResponse?.id || '',
          fullName: userResponse?.fullName || userResponse?.fullname || userResponse?.full_name || userResponse?.name || userData.fullName,
          phone: userResponse?.phone || userData.phone,
          email: userResponse?.email || userData.email || '',
          isAdmin: false
        };
        
        return {
          success: true,
          data: { 
            token: token || '',
            user: partialUser
          },
          message: response.data?.message || 'تم إنشاء الحساب بنجاح'
        };
      }
      
      if (!token || !userResponse) {
        return {
          success: false,
          error: 'Invalid response format from server'
        };
      }
      
      // Ensure user data has consistent structure
      const user = {
        id: String(userResponse.id),
        fullName: userResponse.fullName || userResponse.fullname || userResponse.full_name || userResponse.name || '',
        phone: userResponse.phone || '',
        email: userResponse.email,
        isAdmin: false
      };
      
      return {
        success: true,
        data: { token, user }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Registration failed'
      };
    }
  }, 