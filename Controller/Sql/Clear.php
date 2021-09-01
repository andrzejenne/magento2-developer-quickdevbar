<?php

namespace ADM\QuickDevBar\Controller\Sql;

use ADM\QuickDevBar\Model\Storage;

class Clear extends \ADM\QuickDevBar\Controller\Index
{
    /**
     * @var Storage
     */
    private $storage;

    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \ADM\QuickDevBar\Helper\Data $qdbHelper,
        \Magento\Framework\Controller\Result\RawFactory $resultRawFactory,
        \Magento\Framework\View\LayoutFactory $layoutFactory,
        Storage $storage
    ) {
        parent::__construct($context, $qdbHelper, $resultRawFactory, $layoutFactory);
        $this->storage = $storage;
    }

    public function execute()
    {
        $count = $this->storage->clear();

        $this->_view->loadLayout();
        $resultRaw = $this->_resultRawFactory->create();

        return $resultRaw->setContents(
            \json_encode([
                             'cleared' => $count,
                         ])
        );
    }
}
