<?php
namespace ADM\QuickDevBar\Controller\Sql;

use ADM\QuickDevBar\Model\Storage;

class View extends \ADM\QuickDevBar\Controller\Index
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
        $name = basename($this->getRequest()->getParam('json', ''), '.head.json');

        if (!$this->storage->exists($name)) {
            return $this->_resultRawFactory->create()
                ->setStatusHeader(404)
                ->setContents('{"error": "not found"}');
        }

        $resultRaw = $this->_resultRawFactory->create();

        return $resultRaw->setContents(
            $this->storage->load($name, 'data')
        )->setHeader('Content-Type', 'application/json');
    }


}
