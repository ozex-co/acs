import apiClient from '../apiClient';
import { API_STRUCTURE } from '../api-structure.generated';
import { Section, SectionSchema } from '../types';

/**
 * Section Service
 * Handles all section-related API interactions
 */
class SectionService {
  /**
   * Get all sections
   */
  async getAllSections(): Promise<Section[]> {
    const response = await apiClient.get<{ sections: Section[] }>(
      API_STRUCTURE.sections.getAll.path
    );
    
    // Parse response with Zod for type safety
    const sections = response.data.sections.map(section => SectionSchema.parse(section));
    
    return sections;
  }
}

// Create and export a single instance
const sectionService = new SectionService();
export default sectionService; 