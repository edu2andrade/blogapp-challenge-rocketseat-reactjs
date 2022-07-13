import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';

import { PrismicDocument } from '@prismicio/types';

import { getPrismicClient } from '../services/prismic';

// import commonStyles from '../styles/common.module.scss';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  async function handleMorePosts(): Promise<void> {
    const response = await fetch(nextPage);
    const jsonResponse = await response.json();

    const morePosts = jsonResponse.results.map((post: PrismicDocument) => ({
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd-MMM-yyyy',
        { locale: ptBR }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setPosts([...posts, ...morePosts]);
    setNextPage(jsonResponse.next_page);
  }

  return (
    <>
      <header className={styles.headerContainer}>
        <img src="/spacetraveling.svg" alt="logo" />
      </header>
      <main className={styles.mainContainer}>
        <div className={styles.contentContainer}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a title={`Post: ${post.data.title}`}>
                <strong>{post.data.title}</strong>
                <p className={styles.subtitle}>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <div>
                    <FiCalendar size={20} />
                    <time>{post.first_publication_date}</time>
                  </div>
                  <div>
                    <FiUser size={20} />
                    <p>{post.data.author}</p>
                  </div>
                </div>
              </a>
            </Link>
          ))}
          <button
            type="button"
            onClick={handleMorePosts}
            className={styles.loadPosts}
          >
            Carregar mais posts
          </button>
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 4,
  });

  const response = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd-MMM-yyyy',
        { locale: ptBR }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: response,
      },
    },
    revalidate: 60 * 30, // 30min
  };
};
