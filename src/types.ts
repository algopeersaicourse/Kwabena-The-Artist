export interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

export interface DrawingPrinciple {
  title: string;
  description: string;
  tips: string[];
}

export const DRAWING_PRINCIPLES: DrawingPrinciple[] = [
  {
    title: "Line & Gesture",
    description: "The foundation of any drawing. Focus on the flow and movement rather than details.",
    tips: ["Use your whole arm, not just your wrist", "Keep lines light and loose initially", "Look for the 'S' or 'C' curves in your subject"]
  },
  {
    title: "Shape & Form",
    description: "Breaking complex objects down into simple geometric shapes (circles, squares, triangles).",
    tips: ["Squint to see basic shapes", "Think in 3D: circles become spheres", "Overlap shapes to create depth"]
  },
  {
    title: "Value & Shading",
    description: "Using light and dark to create the illusion of volume and light source.",
    tips: ["Identify your light source first", "Use a range of values from white to black", "Squint to see where the darkest shadows are"]
  },
  {
    title: "Perspective",
    description: "Creating the illusion of space and distance on a flat surface.",
    tips: ["Find the horizon line", "Use vanishing points for straight edges", "Objects get smaller as they recede"]
  }
];
