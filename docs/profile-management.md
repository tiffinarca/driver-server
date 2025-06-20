# Profile Management API

This section covers profile image management operations for users.

**Base URL**: `/api/users`

---

## 📷 Profile Image Management

### 16. Upload Profile Image

**POST** `/api/users/:userId/profile-image`

Upload a new profile image for a user. Requires authentication and user authorization.

#### Request
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Parameters**: `userId` (user ID)
- **Body**: Form data with image file
  - `image`: Image file (JPEG, PNG, etc.)

#### Success Response (201)
```json
{
  "message": "Profile image uploaded successfully",
  "data": {
    "id": 123,
    "profileImageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v123456789/profile_images/abc123.jpg",
    "profileImagePublicId": "profile_images/abc123",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request** (No file provided)
  ```json
  {
    "error": "No image file provided"
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

- **403 Forbidden**
  ```json
  {
    "error": "Access denied"
  }
  ```

---

### 17. Update Profile Image

**PUT** `/api/users/:userId/profile-image`

Replace an existing profile image. Requires authentication and user authorization.

#### Request
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Parameters**: `userId` (user ID)
- **Body**: Form data with image file
  - `image`: New image file

#### Success Response (200)
```json
{
  "message": "Profile image updated successfully",
  "data": {
    "id": 123,
    "profileImageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v123456790/profile_images/def456.jpg",
    "profileImagePublicId": "profile_images/def456",
    "updatedAt": "2024-01-01T13:00:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request** (No file provided)
  ```json
  {
    "error": "No image file provided"
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

---

### 18. Delete Profile Image

**DELETE** `/api/users/:userId/profile-image`

Delete the user's profile image. Requires authentication and user authorization.

#### Request
- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `userId` (user ID)
- **Body**: None

#### Success Response (200)
```json
{
  "message": "Profile image deleted successfully",
  "data": {
    "id": 123,
    "profileImageUrl": null,
    "profileImagePublicId": null,
    "updatedAt": "2024-01-01T14:00:00.000Z"
  }
}
```

#### Error Responses
- **400 Bad Request** (No image to delete)
  ```json
  {
    "error": "User does not have a profile image"
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

---

### 19. Get Profile Image

**GET** `/api/users/:userId/profile-image`

Get the user's profile image URL. Requires authentication and user authorization.

#### Request
- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `userId` (user ID)
- **Body**: None

#### Success Response (200)
```json
{
  "profileImageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v123456789/profile_images/abc123.jpg"
}
```

#### Error Responses
- **401 Unauthorized**
  ```json
  {
    "error": "Authentication required"
  }
  ```

- **500 Internal Server Error**
  ```json
  {
    "error": "Failed to get profile image"
  }
  ```

---

## Image Upload Constraints

- **Supported formats**: JPEG, PNG, GIF, WebP
- **Maximum file size**: 10MB
- **Processing**: Images are automatically optimized and stored on Cloudinary
- **Storage**: Images are stored with unique public IDs for easy management

## Example Usage

### Upload Profile Image (cURL)
```bash
curl -X POST "https://api.example.com/api/users/123/profile-image" \
  -H "Authorization: Bearer your-jwt-token" \
  -F "image=@/path/to/profile-photo.jpg"
``` 