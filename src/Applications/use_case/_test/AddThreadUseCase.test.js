const NewThread = require('../../../Domains/threads/entities/NewThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddThreadUseCase = require('../AddThreadUseCase');

describe('AddThreadUseCase', () => {
  it('should orchestrating the add thread action properly', async () => {
    const useCasePayload = {
      title: 'The Lorem Ipsum Thread',
      body: 'The content of lorem ipsum dolor sit amet thread',
      owner: 'user-abc123',
    };

    const mockAddedThread = new AddedThread({
      id: 'thread-abc123',
      title: useCasePayload.title,
      owner: useCasePayload.owner,
    });

    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.addThread = jest.fn(() => Promise.resolve(mockAddedThread))

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    const addedThread = await addThreadUseCase.execute(useCasePayload);

    expect(addedThread).toStrictEqual(new AddedThread({
      id: 'thread-abc123',
      title: useCasePayload.title,
      owner: useCasePayload.owner,
    }))
    expect(mockThreadRepository.addThread).toBeCalledWith(new NewThread(useCasePayload))

  });
});
