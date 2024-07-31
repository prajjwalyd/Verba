"use client";

import React, { useState, useEffect, useRef } from "react";
import { SettingsConfiguration } from "../Settings/types";
import { HiSparkles } from "react-icons/hi2";
import { IoNewspaper } from "react-icons/io5";
import { FaArrowAltCircleRight } from "react-icons/fa";
import {
  DocumentChunk,
  DocumentPreview,
  VerbaDocument,
  ContentPayload,
  ContentSnippet,
} from "./types";
import ReactMarkdown from "react-markdown";
import PulseLoader from "react-spinners/PulseLoader";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";

import { ChunkScore } from "../Chat/types";

interface ContentViewProps {
  document: VerbaDocument | null;
  settingConfig: SettingsConfiguration;
  APIHost: string | null;
  selectedDocument: string;
  chunkScores?: ChunkScore[];
}

const ContentView: React.FC<ContentViewProps> = ({
  document,
  selectedDocument,
  APIHost,
  settingConfig,
  chunkScores,
}) => {
  if (!document) {
    return <div></div>;
  }

  const [isFetching, setIsFetching] = useState(true);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [content, setContent] = useState<ContentSnippet[]>([]);

  const contentRef = useRef<HTMLDivElement>(null);

  const nextPage = () => {
    if (page == maxPage) {
      setPage(1);
    } else {
      setPage((prev) => prev + 1);
    }
  };

  const previousPage = () => {
    if (page == 1) {
      setPage(maxPage);
    } else {
      setPage((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (document) {
      fetchContent();
      setPage(1);
      setMaxPage(1);
    } else {
      setContent([]);
      setPage(1);
      setMaxPage(1);
    }
  }, [document, chunkScores]);

  useEffect(() => {
    if (document) {
      fetchContent();
    } else {
      setContent([]);
      setPage(1);
      setMaxPage(1);
    }
  }, [page]);

  useEffect(() => {
    if (chunkScores && chunkScores.length > 0) {
      contentRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [content, chunkScores]);

  const fetchContent = async () => {
    try {
      setIsFetching(true);

      const response = await fetch(APIHost + "/api/get_content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uuid: selectedDocument,
          page: page,
          chunkScores: chunkScores ? chunkScores : [],
        }),
      });

      const data: ContentPayload = await response.json();

      if (data) {
        if (data.error !== "") {
          setContent([
            { content: data.error, chunk_id: 0, score: 0, type: "text" },
          ]);
          setPage(1);
          setMaxPage(1);
          setIsFetching(false);
        } else {
          setContent(data.content);
          setMaxPage(data.maxPage);
          setIsFetching(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch content from document:", error);
      setIsFetching(false);
    }
  };

  const renderText = (contentSnippet: ContentSnippet) => {
    if (contentSnippet.type === "text") {
      return (
        <div className="flex p-2" ref={!chunkScores ? contentRef : null}>
          <ReactMarkdown
            className="max-w-[50vw] items-center justify-center flex-wrap md:prose-base sm:prose-sm p-3 prose-pre:bg-bg-alt-verba"
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={
                      settingConfig.Customization.settings.theme === "dark"
                        ? (oneDark as any)
                        : (oneLight as any)
                    }
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {contentSnippet.content}
          </ReactMarkdown>
        </div>
      );
    } else {
      return (
        <div
          className="flex p-2 border-2 flex-col gap-2 border-secondary-verba shadow-lg rounded-3xl"
          ref={contentRef}
        >
          <div className="flex justify-between">
            <div className="flex gap-2">
              <div className="flex gap-2 items-center p-3 bg-secondary-verba rounded-full w-fit">
                <HiSparkles size={12} />
                <p className="text-xs flex text-text-verba">Context Used</p>
              </div>
              <div className="flex gap-2 items-center p-3 bg-secondary-verba rounded-full w-fit">
                <IoNewspaper size={12} />
                <p className="text-xs flex text-text-verba">
                  Chunk {contentSnippet.chunk_id + 1}
                </p>
              </div>
              {contentSnippet.score > 0 && (
                <div className="flex gap-2 items-center p-3 bg-primary-verba rounded-full w-fit">
                  <HiSparkles size={12} />
                  <p className="text-xs flex text-text-verba">
                    Highest Relevancy
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {chunkScores && chunkScores.length > 1 && (
                <button
                  onClick={nextPage}
                  className="flex gap-2 items-center p-3 bg-button-verba hover:bg-button-hover-verba rounded-full w-fit"
                >
                  <FaArrowAltCircleRight size={12} />
                  <p className="text-xs flex text-text-verba">Next Chunk</p>
                </button>
              )}
            </div>
          </div>
          <ReactMarkdown
            className="w-full items-center justify-center flex-wrap md:prose-base sm:prose-sm p-3 prose-pre:bg-bg-alt-verba"
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={
                      settingConfig.Customization.settings.theme === "dark"
                        ? (oneDark as any)
                        : (oneLight as any)
                    }
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {contentSnippet.content}
          </ReactMarkdown>
        </div>
      );
    }
  };

  return (
    <div className="relative flex flex-col gap-2 text-start items-start justify-start">
      {/* Header */}
      <div className="flex gap-4 w-full justify-between">
        <div className="flex gap-4 items-center ">
          {isFetching && (
            <div className="flex items-center justify-center text-text-alt-verba gap-2 h-full">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          )}
          <p className="text-lg font-bold">{document.title}</p>
        </div>
        <div className="gap-2 grid grid-cols-3">
          {Object.entries(document.labels).map(([key, label]) => (
            <div
              key={document.title + key + label}
              className="flex bg-bg-verba min-w-[8vw] p-2 text-sm text-text-verba justify-center text-center items-center rounded-xl"
            >
              <p>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="divider"></div>

      <div className="flex flex-col gap-4 justify-between">
        {/* Text */}
        <div className="flex gap-2 overflow-aut flex-col">
          {content.map((contentSnippet, index) => renderText(contentSnippet))}
        </div>

        <div className="flex flex-col gap-2 items-center  p-4 rounded-lg">
          <div className="join justify-center w-full items-center text-text-verba">
            <button
              onClick={previousPage}
              className="join-item btn btn-sqare border-none bg-button-verba hover:bg-secondary-verba"
            >
              «
            </button>

            <button className="join-item btn border-none bg-button-verba hover:bg-secondary-verba">
              {chunkScores ? "Chunk " : "Page "}
              {page}
            </button>
            <button
              onClick={nextPage}
              className="join-item btn btn-square border-none bg-button-verba hover:bg-secondary-verba"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentView;
