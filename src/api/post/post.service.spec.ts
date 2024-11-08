import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/postgresql';

import { describe } from 'node:test';

import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostRepository } from '../../entity/post.repository';
import { Post } from 'src/entity/post.entity';
import { UpdatePostDto } from './dto/update-post.dto';

describe('PostService', () => {
  let service: PostService;
  let postRepo: PostRepository;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: PostRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            nativeUpdate: jest.fn(),
            nativeDelete: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            flush: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    postRepo = module.get<PostRepository>(PostRepository);
    em = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('신규 게시물이 반환되어야 한다.', async () => {
      const createPostDto: CreatePostDto = {
        title: '제목',
        content: '내용',
        writer: '작성자',
      };
      const post: Post = { id: 1, ...createPostDto };

      jest.spyOn(postRepo, 'create').mockReturnValue(post);
      jest.spyOn(em, 'flush').mockResolvedValue();

      const result = await service.create(createPostDto);

      expect(result).toEqual(post);
      expect(postRepo.create).toHaveBeenCalledWith(createPostDto);
      expect(em.flush).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('게시물이 여러개인 경우 여러개가 반환되어야 한다.', async () => {
      const posts: Post[] = [
        { id: 1, title: '제목', content: '내용', writer: '작성자' },
        { id: 2, title: '제목1', content: '내용1', writer: '작성자1' },
      ];

      jest.spyOn(postRepo, 'findAll').mockResolvedValue(posts);

      const result = await service.findAll();
      expect(result).toEqual(posts);
    });

    it('게시물이 없는 경우 빈 배열을 반환하여야 한다.', async () => {
      const posts: Post[] = [];

      jest.spyOn(postRepo, 'findAll').mockResolvedValue(posts);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('게시물이 존재하는 경우 게시물을 반환하여야 한다.', async () => {
      const post: Post = {
        id: 1,
        title: '제목',
        content: '내용',
        writer: '작성자',
      };

      jest.spyOn(postRepo, 'findOne').mockResolvedValue(post);

      const result = await service.findOne(1);

      expect(result).toEqual(post);
    });

    it('게시물이 없는경우 404 에러를 반환하여야 한다.', async () => {
      const post: Post = null;

      jest.spyOn(postRepo, 'findOne').mockResolvedValue(post);

      try {
        await service.findOne(1);
      } catch (err) {
        expect(err.status).toBe(404);
      }
    });
  });

  describe('update', () => {
    it('변경될 게시물이 존재하는 경우 변경된 게시물이 하나라면 참을 반환한다.', async () => {
      const id: number = 1;
      const post: UpdatePostDto = {
        title: '제목',
        content: '내용',
        writer: '작성자',
      };

      jest.spyOn(postRepo, 'nativeUpdate').mockResolvedValue(1);

      const result = await service.update(id, post);

      expect(result).toEqual(true);
    });

    it('변경될 게시물이 존재하지 않는 경우 404에러를 반환해야 한다.', async () => {
      const id: number = 1;
      const post: UpdatePostDto = {
        title: '제목',
        content: '내용',
        writer: '작성자',
      };

      jest.spyOn(postRepo, 'nativeUpdate').mockResolvedValue(0);

      try {
        await service.update(id, post);
      } catch (err) {
        expect(err.status).toBe(404);
      }
    });
  });
});
