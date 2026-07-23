import { resolveImageSource } from '../utils/imageHelpers';

jest.mock('@react-native-firebase/storage', () => ({
  __esModule: true,
  default: () => ({
    refFromURL: jest.fn().mockReturnValue({
      getDownloadURL: jest.fn().mockResolvedValue('https://cdn.example.com/storage-image.png'),
    }),
    ref: jest.fn().mockReturnValue({
      getDownloadURL: jest.fn().mockResolvedValue('https://cdn.example.com/storage-image.png'),
    }),
  }),
}));

describe('resolveImageSource', () => {
  it('keeps full remote URLs unchanged', () => {
    expect(resolveImageSource('https://cdn.example.com/image.png')).toEqual({
      uri: 'https://cdn.example.com/image.png',
    });
  });

  it('prefixes relative image paths with the upload base URL', () => {
    expect(resolveImageSource('/uploads/products/demo.png')).toEqual({
      uri: 'https://api.crispydosa.info/uploads/products/demo.png',
    });
  });

  it('returns the fallback when no image value is provided', () => {
    const fallback = { uri: 'fallback.png' };
    expect(resolveImageSource('', fallback)).toEqual(fallback);
  });
});
