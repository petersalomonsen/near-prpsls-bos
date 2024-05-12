import {
  REPL_INFRASTRUCTURE_COMMITTEE,
  REPL_DEVHUB,
  REPL_INFRASTRUCTURE_COMMITTEE_CONTRACT,
  REPL_NEAR,
  RFP_IMAGE,
  PROPOSAL_INDEXER_QUERY_NAME,
  fetchGraphQL,
} from "@/includes/common";

const { href } = VM.require(`${REPL_DEVHUB}/widget/core.lib.url`);
href || (href = () => {});

const Container = styled.div`
  .full-width-div {
    width: 100vw;
    position: relative;
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
  }

  .card.no-border {
    border-left: none !important;
    border-right: none !important;
    margin-bottom: -3.5rem;
  }

  @media screen and (max-width: 768px) {
    font-size: 13px;
  }

  .text-sm {
    font-size: 13px;
  }

  .bg-grey {
    background-color: #f4f4f4;
  }

  .border-bottom {
    border-bottom: 1px solid grey;
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .proposal-card {
    border-left: none !important;
    border-right: none !important;
    border-bottom: none !important;
    &:hover {
      background-color: #f4f4f4;
    }
  }

  .blue-btn {
    background-color: #3c697d !important;
    border: none;
    color: white;

    &:active {
      color: white;
    }
  }

  @media screen and (max-width: 768px) {
    .blue-btn {
      padding: 0.5rem 0.8rem !important;
      min-height: 32px;
    }
  }

  a.no-space {
    display: inline-block;
  }

  .text-wrap {
    overflow: hidden;
    white-space: normal;
  }

  .bg-blue {
    background-image: linear-gradient(to bottom, #4b7a93, #213236);
    color: white;
  }
`;

const Heading = styled.div`
  font-size: 24px;
  font-weight: 700;
  width: 100%;

  .text-normal {
    font-weight: normal !important;
  }

  @media screen and (max-width: 768px) {
    font-size: 18px;
  }
`;

const rfpLabelOptions = Near.view(
  REPL_INFRASTRUCTURE_COMMITTEE_CONTRACT,
  "get_global_labels"
);

const FeedItem = ({ proposal, index }) => {
  const accountId = proposal.author_id;
  const profile = Social.get(`${accountId}/profile/**`, "final");
  // We will have to get the proposal from the contract to get the block height.
  const blockHeight = parseInt(proposal.social_db_post_block_height);
  const item = {
    type: "social",
    path: `${REPL_INFRASTRUCTURE_COMMITTEE_CONTRACT}/post/main`,
    blockHeight: blockHeight,
  };

  const isLinked = typeof proposal.linked_rfp === "number";
  const rfpData = null;

  return (
    <a
      href={href({
        widgetSrc: `${REPL_INFRASTRUCTURE_COMMITTEE}/widget/near-prpsls-bos.components.pages.app`,
        params: {
          page: "proposal",
          id: proposal.proposal_id,
        },
      })}
      onClick={(e) => e.stopPropagation()}
      style={{ textDecoration: "none" }}
    >
      <div
        className={
          "proposal-card d-flex justify-content-between gap-2 text-muted cursor-pointer p-3 w-100 flex-wrap flex-sm-nowrap " +
          (index !== 0 && " border")
        }
      >
        <div className="d-flex gap-4 w-100">
          <Widget
            src={`${REPL_DEVHUB}/widget/devhub.entity.proposal.Profile`}
            props={{
              accountId,
            }}
          />
          <div className="d-flex flex-column gap-2 w-100 text-wrap">
            <div className="d-flex gap-2 align-items-center flex-wrap w-100">
              <div className="h6 mb-0 text-black">{proposal.name}</div>
              <Widget
                src={`${REPL_INFRASTRUCTURE_COMMITTEE}/widget/near-prpsls-bos.components.molecule.MultiSelectCategoryDropdown`}
                props={{
                  selected: proposal.labels,
                  disabled: true,
                  hideDropdown: true,
                  onChange: () => {},
                  availableOptions: rfpLabelOptions,
                }}
              />
            </div>
            {isLinked && (
              <div className="text-sm text-muted">
                In response to RFP :
                <a
                  className="text-decoration-underline flex-1"
                  href={href({
                    widgetSrc: `${REPL_INFRASTRUCTURE_COMMITTEE}/widget/near-prpsls-bos.components.pages.app`,
                    params: {
                      page: "rfp",
                      id: rfpData.id,
                    },
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {rfpData.name}
                </a>
              </div>
            )}
            <div className="d-flex gap-2 align-items-center flex-wrap flex-sm-nowrap text-sm w-100">
              <div>#{proposal.proposal_id} ･ </div>
              <div className="text-truncate">
                By {profile.name ?? accountId} ･{" "}
              </div>
              <Widget
                src={`${REPL_NEAR}/widget/TimeAgo`}
                props={{
                  blockHeight,
                  blockTimestamp: proposal.timestamp,
                }}
              />
            </div>
            <div className="d-flex gap-2 align-items-center">
              <Widget
                src={`${REPL_DEVHUB}/widget/devhub.entity.proposal.LikeButton`}
                props={{
                  item,
                  proposalId: proposal.id,
                  notifyAccountId: accountId,
                }}
              />

              <Widget
                src={`${REPL_DEVHUB}/widget/devhub.entity.proposal.CommentIcon`}
                props={{
                  item,
                  showOverlay: false,
                  onClick: () => {},
                }}
              />
            </div>
          </div>
        </div>
        <div className="align-self-center" style={{ minWidth: "fit-content" }}>
          <Widget
            src={`${REPL_DEVHUB}/widget/devhub.entity.proposal.StatusTag`}
            props={{
              timelineStatus: proposal.timeline.status,
            }}
          />
        </div>
      </div>
    </a>
  );
};

const getProposal = (proposal_id) => {
  return Near.asyncView(
    `${REPL_INFRASTRUCTURE_COMMITTEE_CONTRACT}`,
    "get_proposal",
    {
      proposal_id,
    }
  );
};

const FeedPage = () => {
  State.init({
    data: [],
    cachedItems: {},
    stage: "",
    sort: "",
    label: "",
    input: "",
    loading: false,
    loadingMore: false,
    aggregatedCount: null,
    currentlyDisplaying: 0,
  });

  const queryName = PROPOSAL_INDEXER_QUERY_NAME;
  const query = `query GetLatestSnapshot($offset: Int = 0, $limit: Int = 10, $where: ${queryName}_bool_exp = {}) {
    ${queryName}(
      offset: $offset
      limit: $limit
      order_by: {proposal_id: desc}
      where: $where
    ) {
      author_id
      block_height
      name
      labels
      summary
      editor_id
      proposal_id
      ts
      timeline
      views
      linked_rfp
    }
    ${queryName}_aggregate(
      order_by: {proposal_id: desc}
      where: $where
    )  {
      aggregate {
        count
      }
    }
  }`;

  function separateNumberAndText(str) {
    const numberRegex = /\d+/;

    if (numberRegex.test(str)) {
      const number = str.match(numberRegex)[0];
      const text = str.replace(numberRegex, "").trim();
      return { number: parseInt(number), text };
    } else {
      return { number: null, text: str.trim() };
    }
  }

  const buildWhereClause = () => {
    let where = {};

    if (state.label) {
      where = { labels: { _contains: state.label }, ...where };
    }

    if (state.stage) {
      // timeline is stored as jsonb
      where = {
        timeline: { _cast: { String: { _ilike: `%${state.stage}%` } } },
        ...where,
      };
    }
    if (state.input) {
      const { number, text } = separateNumberAndText(state.input);
      if (number) {
        where = { proposal_id: { _eq: number }, ...where };
      }

      if (text) {
        where = { description: { _ilike: `%${text}%` }, ...where };
      }
    }

    return where;
  };

  const buildOrderByClause = () => {
    /**
     * TODO
     * Most commented -> edit contract and indexer
     * Unanswered -> 0 comments
     */
  };

  const makeMoreItems = () => {
    if (state.aggregatedCount <= state.currentlyDisplaying) return;
    fetchProposals(state.data.length);
  };

  const fetchProposals = (offset) => {
    if (!offset) {
      offset = 0;
    }
    if (state.loading) return;
    const FETCH_LIMIT = 10;
    const variables = {
      limit: FETCH_LIMIT,
      offset,
      where: buildWhereClause(),
    };
    fetchGraphQL(query, "GetLatestSnapshot", variables).then(async (result) => {
      if (result.status === 200) {
        if (result.body.data) {
          const data = result.body.data?.[queryName];
          const totalResult = result.body.data?.[`${queryName}_aggregate`];
          State.update({ aggregatedCount: totalResult.aggregate.count });
          // Parse timeline
          fetchBlockHeights(data, offset);
        }
      }
    });
  };

  const renderItem = (item, index) => (
    <div
      key={item.proposal_id}
      className={
        (index !== state.data.length - 1 && "border-bottom ") + index === 0 &&
        " rounded-top-2"
      }
    >
      <FeedItem proposal={item} index={index} />
    </div>
  );
  const cachedRenderItem = (item, index) => {
    if (props.term) {
      return renderItem(item, {
        searchKeywords: [props.term],
      });
    }

    const key = JSON.stringify(item);

    if (!(key in state.cachedItems)) {
      state.cachedItems[key] = renderItem(item, index);
      State.update();
    }
    return state.cachedItems[key];
  };

  useEffect(() => {
    fetchProposals();
  }, [state.sort, state.label, state.stage]);

  const mergeItems = (newItems) => {
    const items = [
      ...new Set([...newItems, ...state.data].map((i) => JSON.stringify(i))),
    ].map((i) => JSON.parse(i));
    // Sorting in the front end
    if (state.sort === "proposal_id" || state.sort === "") {
      items.sort((a, b) => b.proposal_id - a.proposal_id);
    } else if (state.sort === "views") {
      items.sort((a, b) => b.views - a.views);
    }

    return items;
  };

  const fetchBlockHeights = (data, offset) => {
    let promises = data.map((item) => getProposal(item.proposal_id));
    Promise.all(promises).then((blockHeights) => {
      data = data.map((item, index) => ({
        ...item,
        timeline: JSON.parse(item.timeline),
        social_db_post_block_height:
          blockHeights[index].social_db_post_block_height,
      }));
      if (offset) {
        let newData = mergeItems(data);
        State.update({
          data: newData,
          currentlyDisplaying: newData.length,
          loading: false,
        });
      } else {
        State.update({
          data,
          currentlyDisplaying: data.length,
          loading: false,
        });
      }
    });
  };

  const loader = (
    <div className="d-flex justify-content-center align-items-center w-100">
      <Widget
        src={`${REPL_DEVHUB}/widget/devhub.components.molecule.Spinner`}
      />
    </div>
  );

  const renderedItems = state.data ? state.data.map(cachedRenderItem) : null;

  return (
    <Container className="w-100 py-4 px-2 d-flex flex-column gap-3">
      <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center">
        <Heading>
          Proposals
          <span className="text-muted text-normal">
            ({state.aggregatedCount ?? state.data.length}){" "}
          </span>
        </Heading>
        <div className="d-flex flex-wrap gap-4 align-items-center">
          <Widget
            src={`${REPL_DEVHUB}/widget/devhub.feature.proposal-search.by-input`}
            props={{
              search: state.input,
              className: "w-xs-100",
              onSearch: (input) => {
                State.update({ input });
                fetchProposals();
              },
              onEnter: () => {
                fetchProposals();
              },
            }}
          />
          <Widget
            src={`${REPL_DEVHUB}/widget/devhub.feature.proposal-search.by-sort`}
            props={{
              onStateChange: (select) => {
                State.update({ sort: select.value });
              },
            }}
          />
          <div className="d-flex gap-4 align-items-center">
            <Widget
              src={`${REPL_INFRASTRUCTURE_COMMITTEE}/widget/near-prpsls-bos.components.molecule.FilterByLabel`}
              props={{
                onStateChange: (select) => {
                  State.update({ label: select.value });
                },
                availableOptions: rfpLabelOptions,
              }}
            />
            <Widget
              src={`${REPL_DEVHUB}/widget/devhub.feature.proposal-search.by-stage`}
              props={{
                onStateChange: (select) => {
                  State.update({ stage: select.value });
                },
              }}
            />
          </div>
        </div>
        <div className="mt-2 mt-xs-0">
          <Link
            to={href({
              widgetSrc: `${REPL_INFRASTRUCTURE_COMMITTEE}/widget/near-prpsls-bos.components.pages.app`,
              params: { page: "create-proposal" },
            })}
          >
            <Widget
              src={`${REPL_DEVHUB}/widget/devhub.components.molecule.Button`}
              props={{
                label: (
                  <div className="d-flex gap-2 align-items-center">
                    <div>
                      <i className="bi bi-plus-circle-fill"></i>
                    </div>
                    Submit Proposal
                  </div>
                ),
                classNames: { root: "blue-btn" },
              }}
            />
          </Link>
        </div>
      </div>
      <div style={{ minHeight: "50vh" }}>
        {!Array.isArray(state.data) ? (
          loader
        ) : (
          <div className="card no-border rounded-0 mt-4 py-3 full-width-div">
            <div className="container-xl">
              <div className="bg-blue text-sm mt-2 p-3 rounded-3">
                <p className="d-flex gap-3 align-items-center mb-0">
                  <div>
                    <i className="bi bi-info-circle"></i>
                  </div>
                  <div>
                    Welcome to the Infrastructure Committee Proposal Feed! This
                    dedicated space makes it easy to submit and track funding
                    proposals from the Infrastructure Committee, the primary
                    organization overseeing improvements pertaining to wallets,
                    indexers, RPC services, explorers, oracles, bridges, NEAR
                    Protocol features, and related ecosystem upgrades. You are
                    welcome to respond to any RFPs that are accepting
                    submissions or submit an independent proposal.
                  </div>
                </p>
              </div>
              <div className="mt-4 border rounded-2">
                {state.data.length > 0 || state.aggregatedCount === 0 ? (
                  <InfiniteScroll
                    pageStart={0}
                    loadMore={makeMoreItems}
                    hasMore={state.aggregatedCount > state.data.length}
                    loader={loader}
                    useWindow={false}
                    threshold={100}
                  >
                    {renderedItems}
                  </InfiniteScroll>
                ) : (
                  loader
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

return FeedPage(props);
