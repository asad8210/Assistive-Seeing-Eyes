"use client";

export async function mockDescribeScene(
  imageDataUrl: string
): Promise<{ description: string }> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
  const mockObjects = [
    "a potted plant",
    "a coffee mug",
    "a laptop computer",
    "a window with a bright view",
    "a bookshelf filled with books",
    "a comfortable looking chair",
    "a desk lamp",
    "a painting on the wall",
  ];
  const randomIndex = Math.floor(Math.random() * mockObjects.length);
  return { description: `I see ${mockObjects[randomIndex]}.` };
}
